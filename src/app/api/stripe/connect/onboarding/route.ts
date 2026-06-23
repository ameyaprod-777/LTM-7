import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { stripeConnectEnabled } from "@/lib/stripe-config";

/**
 * Crée ou récupère un lien d'onboarding Stripe Connect Express.
 * Inactif tant que STRIPE_SECRET_KEY et STRIPE_CONNECT_ENABLED ne sont pas définis.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!stripeConnectEnabled() || !stripe) {
    return NextResponse.json(
      {
        configured: false,
        message:
          "Stripe Connect n'est pas encore activé sur la plateforme. Vous serez notifié lorsque les virements loueurs seront disponibles.",
      },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeAccountId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  let accountId = user.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: user.email,
      metadata: { userId: user.id },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeAccountId: accountId,
        stripeOnboardingAt: new Date(),
      },
    });
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/payments?refresh=1`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/payments?success=1`,
      type: "account_onboarding",
    });

    return NextResponse.json({ configured: true, url: accountLink.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur Stripe Connect";
    console.error("[stripe/connect] account link:", err);
    return NextResponse.json(
      {
        error:
          message.includes("signed up for Connect")
            ? "Activez Stripe Connect dans le Dashboard Stripe (Connect → Commencer), puis réessayez."
            : message,
      },
      { status: 502 }
    );
  }
}

async function syncConnectAccountFromStripe(userId: string, accountId: string) {
  if (!stripe) return null;

  const account = await stripe.accounts.retrieve(accountId);
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeChargesEnabled: account.charges_enabled ?? false,
      stripePayoutsEnabled: account.payouts_enabled ?? false,
    },
  });

  return {
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeAccountId: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
      stripeOnboardingAt: true,
    },
  });

  const sync = new URL(req.url).searchParams.get("sync") === "1";
  let chargesEnabled = user?.stripeChargesEnabled ?? false;
  let payoutsEnabled = user?.stripePayoutsEnabled ?? false;
  let detailsSubmitted = false;

  if (
    sync &&
    stripeConnectEnabled() &&
    stripe &&
    user?.stripeAccountId
  ) {
    try {
      const synced = await syncConnectAccountFromStripe(
        session.user.id,
        user.stripeAccountId
      );
      if (synced) {
        chargesEnabled = synced.chargesEnabled;
        payoutsEnabled = synced.payoutsEnabled;
        detailsSubmitted = synced.detailsSubmitted;
      }
    } catch (err) {
      console.error("[stripe/connect] sync account:", err);
    }
  }

  return NextResponse.json({
    stripeEnabled: stripeConnectEnabled(),
    accountId: user?.stripeAccountId ?? null,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
    onboardingAt: user?.stripeOnboardingAt ?? null,
  });
}

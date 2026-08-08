import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripeConnectEnabled } from "@/lib/stripe-config";

export const STRIPE_CONNECT_REQUIRED_CODE = "STRIPE_CONNECT_REQUIRED";

export const STRIPE_CONNECT_REQUIRED_MESSAGE =
  "Configurez Stripe Connect pour recevoir vos paiements sur votre compte bancaire avant de publier.";

export const STRIPE_CONNECT_PAYMENTS_PATH = "/dashboard/settings/payments";

export type StripeConnectFields = {
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
};

/** Compte prêt à recevoir un transfer + payout bancaire. */
export function isStripeConnectReadyForPayouts(
  user: StripeConnectFields | null | undefined
): boolean {
  if (!user) return false;
  return Boolean(
    user.stripeAccountId &&
      user.stripeChargesEnabled &&
      user.stripePayoutsEnabled
  );
}

export async function getUserStripeConnectFields(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    },
  });
}

/**
 * Bloque la publication si Connect est activé sur la plateforme
 * et que l'utilisateur n'a pas terminé l'onboarding.
 * Si Connect est désactivé (dev), on ne bloque pas.
 */
export async function assertStripeConnectReadyForPublish(userId: string): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  if (!stripeConnectEnabled()) {
    return { ok: true };
  }

  const user = await getUserStripeConnectFields(userId);
  if (isStripeConnectReadyForPayouts(user)) {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: STRIPE_CONNECT_REQUIRED_MESSAGE,
        code: STRIPE_CONNECT_REQUIRED_CODE,
        redirectTo: STRIPE_CONNECT_PAYMENTS_PATH,
      },
      { status: 403 }
    ),
  };
}

export async function userNeedsStripeConnectSetup(userId: string): Promise<boolean> {
  if (!stripeConnectEnabled()) return false;
  const user = await getUserStripeConnectFields(userId);
  return !isStripeConnectReadyForPayouts(user);
}

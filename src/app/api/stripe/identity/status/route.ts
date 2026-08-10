import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Poll le statut Identity : synchronise Stripe → DB si le webhook n'est
 * pas encore arrivé, pour que la page /verify-identity puisse se mettre à jour.
 */
export async function GET(req: Request) {
  try {
    const limited = enforceRateLimit(req, "identityStatus");
    if (limited) return limited;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        verifiedIdentity: true,
        stripeIdentityVerificationId: true,
        stripeIdentityStatus: true,
        stripeIdentityLastError: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (user.verifiedIdentity) {
      return NextResponse.json({
        verified: true,
        status: user.stripeIdentityStatus ?? "verified",
        lastError: null,
      });
    }

    if (!stripe || !user.stripeIdentityVerificationId) {
      return NextResponse.json({
        verified: false,
        status: user.stripeIdentityStatus,
        lastError: user.stripeIdentityLastError,
      });
    }

    const verification = await stripe.identity.verificationSessions.retrieve(
      user.stripeIdentityVerificationId
    );

    if (verification.status === "verified") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verifiedIdentity: true,
          kycVerifiedAt: new Date(),
          stripeIdentityStatus: verification.status,
          stripeIdentityLastError: null,
        },
      });

      return NextResponse.json({
        verified: true,
        status: "verified",
        lastError: null,
      });
    }

    const lastError =
      verification.last_error?.reason ??
      verification.last_error?.code ??
      null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeIdentityStatus: verification.status,
        ...(verification.status === "requires_input"
          ? { stripeIdentityLastError: lastError }
          : {}),
      },
    });

    return NextResponse.json({
      verified: false,
      status: verification.status,
      lastError:
        verification.status === "requires_input"
          ? lastError
          : user.stripeIdentityLastError,
    });
  } catch (error) {
    console.error("[stripe/identity/status]", error);
    return NextResponse.json(
      { error: "Impossible de récupérer le statut de vérification." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "identitySession");
    if (limited) return limited;

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré côté serveur." },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        verifiedIdentity: true,
        stripeIdentityVerificationId: true,
        stripeIdentityStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (user.verifiedIdentity) {
      return NextResponse.json(
        { error: "Votre identité est déjà vérifiée." },
        { status: 400 }
      );
    }

    if (user.stripeIdentityVerificationId) {
      const existing = await stripe.identity.verificationSessions.retrieve(
        user.stripeIdentityVerificationId
      );

      if (existing.status === "verified") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verifiedIdentity: true,
            kycVerifiedAt: new Date(),
            stripeIdentityStatus: existing.status,
          },
        });
        return NextResponse.json(
          { error: "Votre identité est déjà vérifiée." },
          { status: 400 }
        );
      }

      if (
        existing.status === "requires_input" ||
        existing.status === "processing"
      ) {
        return NextResponse.json({
          clientSecret: existing.client_secret,
          status: existing.status,
        });
      }
    }

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      options: {
        document: {
          require_matching_selfie: true,
          require_live_capture: true,
          allowed_types: ["driving_license", "passport", "id_card"],
        },
      },
      metadata: {
        userId: user.id,
      },
      provided_details: user.email ? { email: user.email } : undefined,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeIdentityVerificationId: verificationSession.id,
        stripeIdentityStatus: verificationSession.status,
        stripeIdentityLastError: null,
      },
    });

    return NextResponse.json({
      clientSecret: verificationSession.client_secret,
      status: verificationSession.status,
    });
  } catch (error) {
    console.error("[stripe/identity/session]", error);
    return NextResponse.json(
      { error: "Impossible de démarrer la vérification d'identité." },
      { status: 500 }
    );
  }
}

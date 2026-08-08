import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeEnabled } from "@/lib/stripe-config";
import { IdentityVerificationButton } from "@/components/membership/identity-verification-button";
import { IdentityVerifiedRedirect } from "@/components/membership/identity-verified-redirect";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Vérification d'identité",
};

export const dynamic = "force-dynamic";

export default async function VerifyIdentityPage({
  searchParams,
}: {
  searchParams: { invite?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/verify-identity");
  }

  if (!session.user.emailVerified) {
    redirect("/verify-email?sent=1");
  }

  if (session.user.role === "MEMBER" || session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  const invite = searchParams.invite;
  const applyHref = invite
    ? `/apply?invite=${encodeURIComponent(invite)}`
    : "/apply";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      verifiedIdentity: true,
      stripeIdentityStatus: true,
      stripeIdentityLastError: true,
    },
  });

  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY ??
    "";

  if (!stripeEnabled() || !publishableKey) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-anthracite">
          Vérification d&apos;identité
        </h1>
        <p className="mt-2 text-anthracite-500">
          Le service de vérification n&apos;est pas encore activé sur cette
          instance. Contactez le support.
        </p>
      </div>
    );
  }

  if (user?.verifiedIdentity) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-600" />
            <div>
              <h1 className="text-xl font-bold text-anthracite">
                Identité vérifiée
              </h1>
              <IdentityVerifiedRedirect />
            </div>
          </div>
          <Link href={applyHref} className="mt-6 inline-block">
            <Button>Continuer ma candidature maintenant</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-anthracite">
        Vérifions votre identité
      </h1>
      <p className="mt-2 text-anthracite-500">
        Avant de compléter votre candidature, nous vérifions votre identité via
        Stripe Identity — c&apos;est rapide, sécurisé et vos documents ne
        transitent pas par LoueTonMatos.
      </p>

      <ul className="mt-6 space-y-2 rounded-xl bg-anthracite-50 p-5 text-sm text-anthracite-600">
        <li>1. Vous cliquez sur « Vérifier mon identité »</li>
        <li>2. Stripe ouvre un module sécurisé (webcam ou smartphone)</li>
        <li>3. Vous photographiez votre pièce d&apos;identité + un selfie</li>
        <li>4. Retour ici automatiquement une fois la vérification faite</li>
      </ul>

      <div className="mt-8">
        <IdentityVerificationButton
          publishableKey={publishableKey}
          initialStatus={user?.stripeIdentityStatus ?? null}
          initialLastError={user?.stripeIdentityLastError ?? null}
        />
      </div>

      <p className="mt-8 text-xs text-anthracite-400">
        En cliquant sur « Vérifier », vous acceptez les{" "}
        <a
          href="https://stripe.com/privacy"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          conditions de confidentialité Stripe
        </a>
        . Consultez notre{" "}
        <Link href="/legal/kyc" className="text-accent hover:underline">
          politique KYC
        </Link>{" "}
        pour plus de détails.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { humanizeStripeIdentityError } from "@/lib/stripe-identity-errors";

type Props = {
  publishableKey: string;
  initialStatus?: string | null;
  initialLastError?: string | null;
};

let stripePromise: Promise<StripeJs | null> | null = null;
function getStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export function IdentityVerificationButton({
  publishableKey,
  initialStatus,
  initialLastError,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    humanizeStripeIdentityError(initialLastError)
  );
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);

  useEffect(() => {
    if (status === "processing") {
      const t = setInterval(() => router.refresh(), 4000);
      return () => clearInterval(t);
    }
  }, [status, router]);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/identity/session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inattendue.");
        setLoading(false);
        return;
      }

      const stripe = await getStripe(publishableKey);
      if (!stripe) {
        setError("Impossible de charger Stripe.");
        setLoading(false);
        return;
      }

      const { error: verifyError } = await stripe.verifyIdentity(
        data.clientSecret
      );

      if (verifyError) {
        setError(verifyError.message ?? "Vérification annulée.");
      } else {
        setStatus("processing");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "processing") {
    return (
      <div className="rounded-xl border border-anthracite-200 bg-anthracite-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold text-anthracite">
              Vérification en cours chez Stripe…
            </p>
            <p className="mt-1 text-sm text-anthracite-500">
              Cela prend généralement moins d&apos;une minute. Cette page se
              rafraîchit automatiquement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Vérification impossible</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-anthracite-100 bg-white p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold text-anthracite">
              Vérification par Stripe Identity
            </p>
            <p className="mt-1 text-sm text-anthracite-500">
              Pièce d&apos;identité + selfie. Vos documents ne sont pas stockés
              chez LoueTonMatos, ils restent chez Stripe (conforme RGPD).
            </p>
            <p className="mt-1 text-xs text-anthracite-400">
              Compter environ 2 minutes. Webcam ou smartphone requis.
            </p>
          </div>
        </div>

        <Button
          type="button"
          className="mt-5 w-full sm:w-auto"
          onClick={handleClick}
          loading={loading}
        >
          Vérifier mon identité
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { humanizeStripeIdentityError } from "@/lib/stripe-identity-errors";

type Props = {
  publishableKey: string;
  initialStatus?: string | null;
  initialLastError?: string | null;
  invite?: string | null;
};

const POLL_MS = 2500;
const MANUAL_REFRESH_AFTER_MS = 60_000;

let stripePromise: Promise<StripeJs | null> | null = null;
function getStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

type StatusPayload = {
  verified?: boolean;
  status?: string | null;
  lastError?: string | null;
  error?: string;
};

export function IdentityVerificationButton({
  publishableKey,
  initialStatus,
  initialLastError,
  invite,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(
    humanizeStripeIdentityError(initialLastError)
  );
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);
  const [showManualRefresh, setShowManualRefresh] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const pollingRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const applyHref = invite
    ? `/apply?invite=${encodeURIComponent(invite)}`
    : "/apply";

  const completeVerification = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    setShowManualRefresh(false);
    try {
      await update({ user: { verifiedIdentity: true } });
    } catch {
      // ignore — hard navigation below still syncs via JWT refresh on next load
    }
    router.refresh();
    // Navigation dure : garantit que middleware + RSC voient le nouveau JWT
    window.location.assign(
      `/verify-identity${invite ? `?invite=${encodeURIComponent(invite)}` : ""}`
    );
  }, [finishing, update, router, invite]);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/stripe/identity/status", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await res.json()) as StatusPayload;
      if (!res.ok) {
        return false;
      }

      if (data.verified) {
        await completeVerification();
        return true;
      }

      if (data.status) {
        setStatus(data.status);
      }

      if (data.status === "requires_input") {
        setError(
          humanizeStripeIdentityError(data.lastError) ??
            "Des informations supplémentaires sont requises."
        );
        startedAtRef.current = null;
        setShowManualRefresh(false);
      }

      return false;
    } catch {
      return false;
    }
  }, [completeVerification]);

  // Polling tant que « processing »
  useEffect(() => {
    if (status !== "processing" || finishing) return;

    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
    }

    pollingRef.current = true;

    const poll = async () => {
      if (!pollingRef.current) return;
      const done = await checkStatus();
      if (done) {
        pollingRef.current = false;
        return;
      }
      if (
        startedAtRef.current != null &&
        Date.now() - startedAtRef.current >= MANUAL_REFRESH_AFTER_MS
      ) {
        setShowManualRefresh(true);
      }
    };

    void poll();
    const interval = setInterval(poll, POLL_MS);

    return () => {
      pollingRef.current = false;
      clearInterval(interval);
    };
  }, [status, finishing, checkStatus]);

  async function handleManualRefresh() {
    setChecking(true);
    setError(null);
    try {
      const done = await checkStatus();
      if (!done) {
        // Force un refresh RSC au cas où le webhook a déjà écrit en DB
        router.refresh();
        window.location.reload();
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    setShowManualRefresh(false);
    startedAtRef.current = null;
    try {
      const res = await fetch("/api/stripe/identity/session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        // Déjà vérifié côté API → on finalise directement
        if (
          typeof data.error === "string" &&
          data.error.includes("déjà vérifiée")
        ) {
          await completeVerification();
          return;
        }
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
        startedAtRef.current = Date.now();
        setStatus("processing");
        // Première sync immédiate (ne dépend pas du webhook)
        void checkStatus();
      }
    } catch (e) {
      console.error(e);
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (finishing) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-green-600" />
          <div>
            <p className="font-semibold text-anthracite">
              Identité confirmée — redirection…
            </p>
            <p className="mt-1 text-sm text-anthracite-500">
              Mise à jour de votre session en cours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-anthracite-200 bg-anthracite-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-semibold text-anthracite">
                Vérification en cours chez Stripe…
              </p>
              <p className="mt-1 text-sm text-anthracite-500">
                Cela prend généralement moins d&apos;une minute. Cette page se
                met à jour automatiquement dès que Stripe confirme votre
                identité.
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-anthracite-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Contrôle du statut en cours…
              </p>
            </div>
          </div>
        </div>

        {showManualRefresh && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-anthracite">
              Toujours en attente après 1 minute ?
            </p>
            <p className="mt-1 text-sm text-anthracite-500">
              Cliquez pour synchroniser le statut Stripe et rafraîchir la page.
              Si la vérification est déjà validée, vous serez redirigé vers
              votre candidature.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleManualRefresh}
                loading={checking}
                className="w-full sm:w-auto"
              >
                Rafraîchir mon statut
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  window.location.assign(applyHref);
                }}
              >
                Aller à ma candidature
              </Button>
            </div>
          </div>
        )}
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

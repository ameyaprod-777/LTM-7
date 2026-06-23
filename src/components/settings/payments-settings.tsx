"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConnectStatus = {
  stripeEnabled: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
  onboardingAt: string | null;
};

export function PaymentsSettings() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState(false);

  const loadStatus = useCallback(async (sync = false) => {
    const url = sync
      ? "/api/stripe/connect/onboarding?sync=1"
      : "/api/stripe/connect/onboarding";
    const res = await fetch(url);
    const json = await res.json();
    setStatus(json);
    setLoading(false);
    return json as ConnectStatus;
  }, []);

  useEffect(() => {
    const fromStripe = searchParams.get("success") === "1";
    const refresh = searchParams.get("refresh") === "1";

    if (fromStripe) {
      setSuccessBanner(true);
    }

    void loadStatus(fromStripe || refresh);
  }, [searchParams, loadStatus]);

  const startOnboarding = async () => {
    setConnecting(true);
    setMessage(null);
    const res = await fetch("/api/stripe/connect/onboarding", { method: "POST" });
    const json = await res.json();
    setConnecting(false);

    if (!res.ok && json.error) {
      setMessage(
        typeof json.error === "string"
          ? json.error
          : "Impossible de démarrer l'onboarding Stripe."
      );
      return;
    }

    if (json.configured === false) {
      setMessage(json.message);
      return;
    }

    if (json.url) {
      window.location.href = json.url;
    }
  };

  if (loading) {
    return <p className="text-sm text-anthracite-400">Chargement…</p>;
  }

  if (!status?.stripeEnabled) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-medium text-amber-900">Paiements en cours d&apos;activation</p>
            <p className="mt-1 text-sm text-amber-800">
              Stripe Connect n&apos;est pas activé sur la plateforme (
              <code className="text-xs">STRIPE_CONNECT_ENABLED</code>
              ). Redémarrez le serveur après modification du fichier .env.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const readyForPayouts =
    status.chargesEnabled && status.payoutsEnabled;

  return (
    <div className="space-y-4 rounded-xl border border-anthracite-100 bg-white p-5">
      {successBanner && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Retour Stripe enregistré. Si les cases ci-dessous ne sont pas vertes,
          cliquez sur « Mettre à jour mon compte » ou « Actualiser le statut ».
        </div>
      )}

      <div className="flex items-start gap-3">
        <CreditCard className="h-5 w-5 text-accent" />
        <div>
          <p className="font-medium text-anthracite">Compte Stripe Connect</p>
          <p className="mt-1 text-sm text-anthracite-500">
            Liez votre compte pour recevoir automatiquement la part loueur à la
            clôture de chaque location (loyer + livraison). La commission
            plateforme reste sur le compte LoueTonMatos.
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          {status.chargesEnabled ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-anthracite-400" />
          )}
          Encaissement activé
        </li>
        <li className="flex items-center gap-2">
          {status.payoutsEnabled ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-anthracite-400" />
          )}
          Virements activés
        </li>
      </ul>

      {status.accountId && (
        <p className="text-xs text-anthracite-400">
          Compte Connect : {status.accountId}
        </p>
      )}

      {readyForPayouts ? (
        <p className="text-sm text-green-700">
          Votre compte est prêt. À la fin d&apos;une location payée par carte,
          le virement vers votre compte Stripe se fait lorsque vous cliquez sur
          « Marquer terminée » (loueur ou locataire).
        </p>
      ) : (
        <p className="text-sm text-anthracite-500">
          En mode test, utilisez des données fictives sur le formulaire Stripe
          (téléphone 0000000000, code SMS 000000).
        </p>
      )}

      {message && <p className="text-sm text-red-600">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <Button loading={connecting} onClick={startOnboarding}>
          {status.accountId ? "Mettre à jour mon compte" : "Configurer mes paiements"}
        </Button>
        {status.accountId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              void loadStatus(true);
            }}
          >
            Actualiser le statut
          </Button>
        )}
      </div>
    </div>
  );
}

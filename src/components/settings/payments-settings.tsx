"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Landmark,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConnectStatus = {
  stripeEnabled: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
  onboardingAt: string | null;
};

type IbanStatus = {
  payoutMethod: string;
  ibanReady: boolean;
  ibanMasked: string;
  ibanLast4: string | null;
  ibanHolderName: string | null;
  readyForPublish: boolean;
  connectReady: boolean;
};

export function PaymentsSettings() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [iban, setIban] = useState<IbanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [savingIban, setSavingIban] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ibanError, setIbanError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [ibanValue, setIbanValue] = useState("");

  const loadIban = useCallback(async () => {
    const res = await fetch("/api/users/me/iban");
    if (!res.ok) return null;
    const json = (await res.json()) as IbanStatus;
    setIban(json);
    if (json.ibanHolderName) setHolderName(json.ibanHolderName);
    return json;
  }, []);

  const loadStatus = useCallback(async (sync = false) => {
    const url = sync
      ? "/api/stripe/connect/onboarding?sync=1"
      : "/api/stripe/connect/onboarding";
    const res = await fetch(url);
    const json = await res.json();
    setStatus(json);
    return json as ConnectStatus;
  }, []);

  useEffect(() => {
    const fromStripe = searchParams.get("success") === "1";
    const refresh = searchParams.get("refresh") === "1";
    if (fromStripe) setSuccessBanner(true);

    void (async () => {
      await Promise.all([loadIban(), loadStatus(fromStripe || refresh)]);
      setLoading(false);
    })();
  }, [searchParams, loadIban, loadStatus]);

  const saveIban = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIban(true);
    setIbanError(null);
    const res = await fetch("/api/users/me/iban", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holderName, iban: ibanValue }),
    });
    const json = await res.json();
    setSavingIban(false);
    if (!res.ok) {
      setIbanError(
        typeof json.error === "string" ? json.error : "Enregistrement impossible."
      );
      return;
    }
    setIbanValue("");
    await loadIban();
  };

  const removeIban = async () => {
    if (!window.confirm("Supprimer votre IBAN enregistré ?")) return;
    await fetch("/api/users/me/iban", { method: "DELETE" });
    setHolderName("");
    await loadIban();
  };

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

  const readyForPayouts =
    status?.chargesEnabled && status?.payoutsEnabled;
  const canPublish = Boolean(iban?.readyForPublish);

  return (
    <div className="space-y-6">
      {canPublish ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Vous pouvez publier des annonces : un moyen de recevoir vos fonds est
          configuré
          {readyForPayouts
            ? " (Stripe Connect)."
            : iban?.ibanReady
              ? " (IBAN)."
              : "."}
          {iban?.ibanReady && !readyForPayouts && (
            <>
              {" "}
              Astuce : passez à Stripe Connect pour des virements automatiques
              plus sécurisés.
            </>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configurez un moyen de paiement pour publier.{" "}
          <strong>Stripe Connect</strong> est recommandé (le plus sûr et
          fiable) ; l&apos;IBAN permet de démarrer plus vite.
        </div>
      )}

      {/* Stripe Connect — recommandé */}
      <section className="space-y-4 rounded-xl border-2 border-accent/30 bg-white p-5">
        {successBanner && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Retour Stripe enregistré. Actualisez le statut si besoin.
          </div>
        )}

        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-accent" />
          <div>
            <p className="font-medium text-anthracite">
              Stripe Connect{" "}
              <span className="ml-1 rounded-md bg-accent-muted px-1.5 py-0.5 text-xs font-semibold text-accent">
                Recommandé
              </span>
            </p>
            <p className="mt-1 text-sm text-anthracite-500">
              C&apos;est le moyen le plus <strong>sécurisé</strong> et le plus{" "}
              <strong>fiable</strong> pour recevoir vos gains. Virements
              automatiques à la clôture, identité vérifiée par Stripe, traçabilité
              complète. LoueTonMatos recommande cette option.
            </p>
          </div>
        </div>

        {!status?.stripeEnabled ? (
          <div className="flex gap-3 rounded-lg border border-anthracite-100 bg-anthracite-50 p-3 text-sm text-anthracite-600">
            <AlertCircle className="h-4 w-4 shrink-0 text-anthracite-400" />
            Stripe Connect n&apos;est pas activé sur cette instance (
            <code className="text-xs">STRIPE_CONNECT_ENABLED</code>). Vous
            pouvez utiliser l&apos;IBAN en attendant.
          </div>
        ) : (
          <>
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

            {message && <p className="text-sm text-red-600">{message}</p>}

            <div className="flex flex-wrap gap-2">
              <Button loading={connecting} onClick={startOnboarding}>
                {status.accountId
                  ? "Mettre à jour Stripe"
                  : "Configurer Stripe Connect"}
              </Button>
              {status.accountId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    void loadStatus(true).finally(() => setLoading(false));
                  }}
                >
                  Actualiser
                </Button>
              )}
            </div>
          </>
        )}
      </section>

      {/* IBAN — alternative rapide */}
      <section className="space-y-4 rounded-xl border border-anthracite-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <Landmark className="h-5 w-5 text-accent" />
          <div>
            <p className="font-medium text-anthracite">
              IBAN{" "}
              <span className="ml-1 text-xs font-normal text-anthracite-400">
                alternative rapide
              </span>
            </p>
            <p className="mt-1 text-sm text-anthracite-500">
              Pour démarrer sans onboarding Stripe : indiquez le compte sur
              lequel LoueTonMatos vous versera votre part (virement SEPA manuel
              après chaque location). Moins automatisé que Connect, mais
              suffisant pour publier.
            </p>
          </div>
        </div>

        {iban?.ibanReady && (
          <div className="rounded-lg border border-anthracite-100 bg-anthracite-50/60 px-4 py-3 text-sm">
            <p className="font-medium text-anthracite">
              {iban.ibanHolderName}
            </p>
            <p className="mt-1 font-mono text-anthracite-600">
              {iban.ibanMasked}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => void removeIban()}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        )}

        <form onSubmit={(e) => void saveIban(e)} className="space-y-3">
          {ibanError && (
            <p className="text-sm text-red-600">{ibanError}</p>
          )}
          <div>
            <Label htmlFor="holder">Titulaire du compte</Label>
            <Input
              id="holder"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Nom Prénom"
              required
            />
          </div>
          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={ibanValue}
              onChange={(e) => setIbanValue(e.target.value)}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              required={!iban?.ibanReady}
              autoComplete="off"
              className="font-mono uppercase"
            />
            <p className="mt-1 text-xs text-anthracite-400">
              Stocké chiffré. Visible uniquement par vous et l&apos;équipe admin
              pour effectuer le virement.
            </p>
          </div>
          <Button type="submit" variant="outline" loading={savingIban}>
            {iban?.ibanReady ? "Mettre à jour l’IBAN" : "Enregistrer mon IBAN"}
          </Button>
        </form>
      </section>
    </div>
  );
}

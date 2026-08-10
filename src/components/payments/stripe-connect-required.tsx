import Link from "next/link";
import { CreditCard, Landmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYOUT_SETTINGS_PATH } from "@/lib/stripe-connect-gate";

type Props = {
  resourceLabel?: string;
};

/** Blocage publication : IBAN ou Connect manquant. */
export function StripeConnectRequired({
  resourceLabel = "une annonce",
}: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm">
          <CreditCard className="h-6 w-6 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-anthracite">
            Configurez vos paiements avant de publier
          </h2>
          <p className="mt-2 text-sm text-anthracite-600">
            Pour publier {resourceLabel}, choisissez comment recevoir vos gains.
          </p>

          <div className="mt-4 space-y-3 text-sm text-anthracite-600">
            <div className="rounded-xl border border-accent/20 bg-white/80 p-3">
              <p className="flex items-center gap-2 font-medium text-anthracite">
                <CreditCard className="h-4 w-4 text-accent" />
                Stripe Connect — recommandé
              </p>
              <p className="mt-1 text-anthracite-500">
                Le moyen le plus <strong>sécurisé</strong> et le plus{" "}
                <strong>fiable</strong>. Virements automatiques, identité
                vérifiée par Stripe. C&apos;est ce que LoueTonMatos recommande.
              </p>
            </div>
            <div className="rounded-xl border border-anthracite-100 bg-white/60 p-3">
              <p className="flex items-center gap-2 font-medium text-anthracite">
                <Landmark className="h-4 w-4 text-accent" />
                IBAN — alternative rapide
              </p>
              <p className="mt-1 text-anthracite-500">
                Suffisant pour démarrer : virement SEPA manuel après chaque
                location.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={PAYOUT_SETTINGS_PATH}>
              <Button>
                Configurer mes paiements
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-anthracite-500 hover:text-accent"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

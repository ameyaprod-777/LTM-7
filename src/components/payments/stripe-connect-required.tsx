import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STRIPE_CONNECT_PAYMENTS_PATH } from "@/lib/stripe-connect-gate";

type Props = {
  /** Contexte affiché dans le titre (annonce / service) */
  resourceLabel?: string;
};

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
            Pour publier {resourceLabel}, vous devez d&apos;abord lier votre
            compte bancaire via Stripe Connect. Ainsi, à la fin de chaque
            location, votre part (loyer + livraison) est versée directement sur
            votre compte — la commission plateforme reste chez LoueTonMatos.
          </p>
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-anthracite-600">
            <li>Identité et IBAN via Stripe (sécurisé)</li>
            <li>Aucune carte bancaire à saisir de votre côté</li>
            <li>Virements automatiques après clôture de location</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={STRIPE_CONNECT_PAYMENTS_PATH}>
              <Button>
                Configurer Stripe Connect
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

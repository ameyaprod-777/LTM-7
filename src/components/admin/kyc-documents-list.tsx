import {
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { humanizeStripeIdentityError } from "@/lib/stripe-identity-errors";

type Props = {
  verifiedIdentity: boolean;
  verifiedAt: Date | null;
  stripeStatus: string | null;
  stripeLastError: string | null;
  stripeVerificationId: string | null;
};

/** Rend l'état de vérification Stripe Identity côté admin. */
export function IdentityVerificationPanel({
  verifiedIdentity,
  verifiedAt,
  stripeStatus,
  stripeLastError,
  stripeVerificationId,
}: Props) {
  const humanError = humanizeStripeIdentityError(stripeLastError);
  const stripeLink = stripeVerificationId ? (
    <a
      href={`https://dashboard.stripe.com/identity/verification-sessions/${stripeVerificationId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
    >
      Voir dans Stripe
      <ExternalLink className="h-3 w-3" />
    </a>
  ) : null;

  if (verifiedIdentity) {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900">
              Identité vérifiée par Stripe Identity
            </p>
            {verifiedAt && (
              <p className="mt-1 text-xs text-green-800">
                Vérifiée le {formatDate(verifiedAt)}
              </p>
            )}
            <div className="text-green-800">{stripeLink}</div>
          </div>
        </div>
      </div>
    );
  }

  const inProgress =
    stripeStatus === "processing" || stripeStatus === "requires_input";

  if (inProgress) {
    return (
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-700" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">
              Vérification Stripe Identity en cours
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Statut Stripe : <span className="font-medium">{stripeStatus}</span>
              {stripeStatus === "requires_input" &&
                " — Le candidat doit fournir des informations complémentaires."}
              {stripeStatus === "processing" &&
                " — Stripe analyse les documents (quelques minutes en général)."}
            </p>
            {humanError && (
              <p className="mt-1 text-xs text-blue-800">
                Dernière erreur : {humanError}
              </p>
            )}
            <div className="text-blue-800">{stripeLink}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            Identité non vérifiée
          </p>
          <p className="mt-1 text-xs text-amber-800">
            {stripeStatus
              ? `Statut Stripe : ${stripeStatus}`
              : "Aucune session Stripe Identity créée pour ce candidat."}
          </p>
          {humanError && (
            <p className="mt-1 text-xs text-amber-800">
              Erreur : {humanError}
            </p>
          )}
          <div className="text-amber-800">{stripeLink}</div>
        </div>
      </div>
    </div>
  );
}

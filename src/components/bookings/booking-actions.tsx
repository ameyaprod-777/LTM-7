"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CANCELLATION_LABELS } from "@/lib/constants";
import type { CancellationPolicy } from "@prisma/client";
import { DamageReportDialog } from "@/components/bookings/damage-report-dialog";
import { isBookingEndDateReached } from "@/lib/booking-dates";

type Props = {
  bookingId: string;
  listingTitle: string;
  status: string;
  role: "renter" | "lister";
  endDate: string | Date;
  renterCompletedAt?: string | null;
  listerApprovedAt?: string | null;
  paymentStatus?: string | null;
  cancellationPolicy?: CancellationPolicy;
  stripePaymentsEnabled?: boolean;
};

export function BookingActions({
  bookingId,
  listingTitle,
  status,
  role,
  endDate,
  renterCompletedAt,
  listerApprovedAt,
  paymentStatus,
  cancellationPolicy,
  stripePaymentsEnabled = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelInfo, setCancelInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);

  const endReached = isBookingEndDateReached(endDate);
  const renterConfirmed = !!renterCompletedAt;
  const canCloseFlow = ["CONFIRMED", "ACTIVE"].includes(status);

  const act = async (action: string, reason?: string) => {
    setLoading(action);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    const json = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(
        typeof json.error === "string" ? json.error : "Action impossible."
      );
      return;
    }

    if (action === "cancel" && json.cancellation?.label) {
      setCancelInfo(json.cancellation.label);
    }

    if (action === "dispute") {
      setShowDispute(false);
      setDisputeReason("");
    }

    router.refresh();
  };

  const pay = async () => {
    setLoading("pay");
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/checkout`, {
      method: "POST",
    });
    const json = await res.json();
    setLoading(null);
    if (res.ok && json.checkoutUrl) {
      window.location.href = json.checkoutUrl;
      return;
    }
    setError(
      typeof json.error === "string" ? json.error : "Paiement impossible."
    );
  };

  const awaitingPayment =
    status === "PENDING" &&
    !!listerApprovedAt &&
    paymentStatus === "PENDING" &&
    stripePaymentsEnabled;

  return (
    <div className="space-y-2">
      {status === "PENDING" && role === "lister" && !listerApprovedAt && (
        <Button
          size="sm"
          loading={loading === "approve"}
          onClick={() => act("approve")}
        >
          Approuver la demande
        </Button>
      )}

      {awaitingPayment && role === "renter" && (
        <Button size="sm" loading={loading === "pay"} onClick={pay}>
          Payer la réservation
        </Button>
      )}

      {status === "PENDING" && role === "lister" && listerApprovedAt && (
        <p className="text-xs text-anthracite-500">
          En attente du paiement du locataire
        </p>
      )}

      {["PENDING", "CONFIRMED"].includes(status) && status !== "DISPUTED" && (
        <Button
          size="sm"
          variant="outline"
          loading={loading === "cancel"}
          onClick={() => act("cancel")}
        >
          Annuler
        </Button>
      )}

      {["CONFIRMED", "ACTIVE", "COMPLETED"].includes(status) &&
        status !== "DISPUTED" && (
          <DamageReportDialog
            bookingId={bookingId}
            listingTitle={listingTitle}
          />
        )}

      {/* Clôture en 2 étapes — uniquement à partir du jour de fin */}
      {canCloseFlow && (
        <div className="space-y-2 rounded-lg border border-anthracite-100 bg-anthracite-50/60 p-3">
          {!endReached && (
            <p className="text-xs text-anthracite-500">
              Clôture possible à partir du jour de fin de la réservation.
            </p>
          )}

          {endReached && role === "renter" && !renterConfirmed && (
            <>
              <p className="text-xs text-anthracite-600">
                Confirmez que le matériel a bien été rendu / que la location est
                terminée. Le loueur devra ensuite valider pour libérer le
                paiement.
              </p>
              <Button
                size="sm"
                loading={loading === "complete"}
                onClick={() => act("complete")}
              >
                Confirmer la fin de location
              </Button>
            </>
          )}

          {endReached && role === "renter" && renterConfirmed && (
            <p className="text-xs text-green-700">
              Vous avez confirmé la fin. En attente de la validation du loueur
              pour libérer le paiement.
            </p>
          )}

          {endReached && role === "lister" && !renterConfirmed && (
            <p className="text-xs text-anthracite-500">
              En attente de la confirmation du locataire. Vous pourrez ensuite
              valider la fin et recevoir votre paiement.
            </p>
          )}

          {endReached && role === "lister" && renterConfirmed && (
            <>
              <p className="text-xs font-medium text-accent">
                Le locataire a confirmé la fin de location.
              </p>
              <p className="text-xs text-anthracite-600">
                Validez pour clôturer et recevoir votre part sur votre compte
                Stripe.
              </p>
              <Button
                size="sm"
                loading={loading === "complete"}
                onClick={() => act("complete")}
              >
                Location terminée — libérer le paiement
              </Button>
            </>
          )}

          {endReached && (
            <div className="pt-1">
              {!showDispute ? (
                <button
                  type="button"
                  className="text-xs text-red-700 underline-offset-2 hover:underline"
                  onClick={() => setShowDispute(true)}
                >
                  Ouvrir un litige
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Décrivez le problème (matériel non rendu, casse, désaccord…)"
                    rows={3}
                    className="w-full rounded-lg border border-anthracite-200 px-3 py-2 text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loading === "dispute"}
                      onClick={() => {
                        if (!disputeReason.trim()) {
                          setError("Indiquez un motif pour le litige.");
                          return;
                        }
                        void act("dispute", disputeReason.trim());
                      }}
                    >
                      Envoyer le litige
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-anthracite-500"
                      onClick={() => {
                        setShowDispute(false);
                        setDisputeReason("");
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {status === "DISPUTED" && (
        <p className="text-xs text-red-700">
          Litige en cours — fonds gelés jusqu&apos;à résolution par
          l&apos;équipe.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {cancelInfo && (
        <p className="text-xs text-anthracite-600">{cancelInfo}</p>
      )}

      {cancellationPolicy && (
        <p className="text-xs text-anthracite-400">
          Politique : {CANCELLATION_LABELS[cancellationPolicy]}
        </p>
      )}
    </div>
  );
}

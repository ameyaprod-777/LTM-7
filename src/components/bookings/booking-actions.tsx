"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CANCELLATION_LABELS } from "@/lib/constants";
import type { CancellationPolicy } from "@prisma/client";
import { DamageReportDialog } from "@/components/bookings/damage-report-dialog";

type Props = {
  bookingId: string;
  listingTitle: string;
  status: string;
  role: "renter" | "lister";
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
  listerApprovedAt,
  paymentStatus,
  cancellationPolicy,
  stripePaymentsEnabled = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelInfo, setCancelInfo] = useState<string | null>(null);

  const act = async (action: string, reason?: string) => {
    setLoading(action);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    const json = await res.json();
    setLoading(null);

    if (action === "cancel" && json.cancellation?.label) {
      setCancelInfo(json.cancellation.label);
    }

    if (action === "approve" && json.payUrl && role === "renter") {
      /* le locataire paie via bouton dédié */
    }

    router.refresh();
  };

  const pay = async () => {
    setLoading("pay");
    const res = await fetch(`/api/bookings/${bookingId}/checkout`, {
      method: "POST",
    });
    const json = await res.json();
    setLoading(null);
    if (res.ok && json.checkoutUrl) {
      window.location.href = json.checkoutUrl;
    }
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

      {["CONFIRMED", "ACTIVE"].includes(status) && (
        <>
          <Button
            size="sm"
            loading={loading === "complete"}
            onClick={() => act("complete")}
          >
            Marquer terminée
          </Button>
        </>
      )}

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

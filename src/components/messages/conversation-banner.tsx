"use client";

import { CheckCircle, CreditCard } from "lucide-react";

export function ConversationBanner({
  bookingConfirmed,
  paid,
}: {
  bookingConfirmed?: boolean;
  paid?: boolean;
}) {
  if (!bookingConfirmed && !paid) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      {paid ? (
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <p>
        {paid
          ? "Paiement reçu — poursuivez la conversation avec le loueur pour finaliser les détails."
          : "Réservation enregistrée — échangez ici avec le loueur pour organiser la location."}
      </p>
    </div>
  );
}

import type { CancellationPolicy } from "@prisma/client";
import { differenceInHours } from "date-fns";

export type CancellationRefund = {
  refundPercent: number;
  refundAmount: number;
  platformKeeps: number;
  label: string;
};

/**
 * Calcule le remboursement selon la politique copiée sur la réservation.
 * Les montants sont en centimes.
 */
export function computeCancellationRefund(
  policy: CancellationPolicy,
  totalAmount: number,
  startDate: Date,
  cancelledAt: Date = new Date()
): CancellationRefund {
  const hoursUntilStart = differenceInHours(startDate, cancelledAt);

  let refundPercent = 0;
  let label = "Aucun remboursement";

  switch (policy) {
    case "FLEXIBLE":
      if (hoursUntilStart >= 24) {
        refundPercent = 100;
        label = "Remboursement intégral (annulation > 24 h avant le début)";
      } else if (hoursUntilStart > 0) {
        refundPercent = 50;
        label = "Remboursement partiel 50 % (annulation < 24 h avant le début)";
      }
      break;
    case "MODERATE":
      if (hoursUntilStart >= 24 * 5) {
        refundPercent = 100;
        label = "Remboursement intégral (annulation > 5 jours avant)";
      } else if (hoursUntilStart >= 24) {
        refundPercent = 50;
        label = "Remboursement partiel 50 % (annulation entre 24 h et 5 jours)";
      }
      break;
    case "STRICT":
      if (hoursUntilStart >= 24 * 14) {
        refundPercent = 100;
        label = "Remboursement intégral (annulation > 14 jours avant)";
      } else if (hoursUntilStart >= 24 * 7) {
        refundPercent = 50;
        label = "Remboursement partiel 50 % (annulation entre 7 et 14 jours)";
      }
      break;
  }

  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  const platformKeeps = totalAmount - refundAmount;

  return { refundPercent, refundAmount, platformKeeps, label };
}

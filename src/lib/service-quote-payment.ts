import {
  ServicePaymentTiming,
  type ServiceQuotePaymentMethod,
} from "@prisma/client";
import { startOfDay } from "date-fns";

/** Montant facturable : devis ou tarif affiché du service. */
export function resolveQuoteAmountCents(
  proposedAmount: number | null | undefined,
  servicePriceAmount?: number | null
): number | null {
  if (proposedAmount != null && proposedAmount > 0) return proposedAmount;
  if (servicePriceAmount != null && servicePriceAmount > 0) {
    return servicePriceAmount;
  }
  return null;
}

export function computeServiceQuoteTotals(
  providerAmountCents: number,
  commissionRate: number
) {
  const commissionFee = Math.round(providerAmountCents * commissionRate);
  const amount = providerAmountCents + commissionFee;
  return { commissionFee, amount, providerAmount: providerAmountCents };
}

export function isQuotePaymentSettled(payment?: { status: string } | null) {
  return (
    payment?.status === "HELD" ||
    payment?.status === "RELEASED"
  );
}

export function canPayServiceQuoteStripe(quote: {
  status: string;
  amountCents: number | null;
  agreedPaymentTiming: ServicePaymentTiming | null;
  payment?: {
    status: string;
    method: ServiceQuotePaymentMethod | null;
  } | null;
}) {
  if (quote.status !== "ACCEPTED") return false;
  if (!quote.amountCents || quote.amountCents <= 0) return false;
  if (!quote.agreedPaymentTiming) return false;
  if (quote.payment?.method === "CASH") return false;
  if (isQuotePaymentSettled(quote.payment)) return false;
  return true;
}

export function canDeclareCashPayment(quote: {
  status: string;
  amountCents: number | null;
  payment?: {
    status: string;
    method: ServiceQuotePaymentMethod | null;
  } | null;
}) {
  if (quote.status !== "ACCEPTED") return false;
  if (!quote.amountCents || quote.amountCents <= 0) return false;
  if (quote.payment?.method === "STRIPE" && isQuotePaymentSettled(quote.payment)) {
    return false;
  }
  if (quote.payment?.method === "CASH") return false;
  if (isQuotePaymentSettled(quote.payment)) return false;
  return true;
}

/** Prestataire : confirmer le règlement et clôturer. */
export function canProviderSettleQuote(quote: {
  status: string;
  agreedPaymentTiming: ServicePaymentTiming | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  payment?: {
    status: string;
    method: ServiceQuotePaymentMethod | null;
    clientDeclaredCashAt: Date | string | null;
  } | null;
}) {
  if (quote.status !== "ACCEPTED") return false;
  if (!quote.agreedPaymentTiming) return false;

  const timing = quote.agreedPaymentTiming;
  const method = quote.payment?.method;
  const status = quote.payment?.status;

  if (timing === ServicePaymentTiming.UPFRONT) {
    if (method === "STRIPE") return status === "HELD";
    if (method === "CASH") return !!quote.payment?.clientDeclaredCashAt;
    return false;
  }

  // AFTER_SERVICE — fin de projet
  if (!isAfterServicePeriodEnded(quote.endDate)) return false;
  if (method === "STRIPE") return status === "HELD";
  if (method === "CASH") return !!quote.payment?.clientDeclaredCashAt;
  return false;
}

export function isAfterServicePeriodEnded(endDate: Date | string | null) {
  if (!endDate) return true;
  const end = startOfDay(
    typeof endDate === "string" ? new Date(endDate) : endDate
  );
  return startOfDay(new Date()) >= end;
}

export function settleTimingLabel(timing: ServicePaymentTiming) {
  return timing === "UPFRONT"
    ? "au début du projet"
    : "à la fin du projet";
}

/** @deprecated use canPayServiceQuoteStripe */
export function canPayServiceQuote(quote: {
  status: string;
  agreedPaymentTiming: ServicePaymentTiming | null;
  amountCents: number | null;
  payment?: { status: string } | null;
}) {
  return canPayServiceQuoteStripe({
    ...quote,
    payment: quote.payment
      ? { ...quote.payment, method: null }
      : null,
  });
}

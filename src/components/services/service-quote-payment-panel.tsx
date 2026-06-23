"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Banknote } from "lucide-react";
import type { ServicePaymentTiming, ServiceQuotePaymentMethod } from "@prisma/client";
import {
  SERVICE_PAYMENT_TIMING_LABELS,
  SERVICE_QUOTE_PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import {
  canPayServiceQuoteStripe,
  canDeclareCashPayment,
  resolveQuoteAmountCents,
} from "@/lib/service-quote-payment";
import { formatCents } from "@/lib/money";
import { Button } from "@/components/ui/button";

type PaymentInfo = {
  status: string;
  method: ServiceQuotePaymentMethod | null;
  clientDeclaredCashAt: string | null;
};

type Props = {
  quoteId: string;
  status: string;
  serviceTitle: string;
  proposedAmount: number | null;
  servicePriceAmount?: number | null;
  agreedPaymentTiming?: ServicePaymentTiming | null;
  payment?: PaymentInfo | null;
  stripePaymentsEnabled?: boolean;
};

export function ServiceQuotePaymentPanel({
  quoteId,
  status,
  serviceTitle,
  proposedAmount,
  servicePriceAmount,
  agreedPaymentTiming,
  payment,
  stripePaymentsEnabled = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (status !== "ACCEPTED") return null;

  const amountCents = resolveQuoteAmountCents(proposedAmount, servicePriceAmount);
  const paymentStatus = payment?.status ?? null;
  const timing = agreedPaymentTiming ?? "UPFRONT";

  const quoteForPayment = {
    status,
    amountCents,
    agreedPaymentTiming: agreedPaymentTiming ?? null,
    payment: payment ?? null,
  };

  const stripePayable =
    stripePaymentsEnabled && canPayServiceQuoteStripe(quoteForPayment);
  const cashDeclarable = canDeclareCashPayment({
    status,
    amountCents,
    payment: payment ?? null,
  });

  const payStripe = async () => {
    setLoading("pay");
    const res = await fetch(`/api/services/quotes/${quoteId}/checkout`, {
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    setLoading(null);
    if (res.ok && json.checkoutUrl) {
      window.location.href = json.checkoutUrl;
      return;
    }
    alert(typeof json.error === "string" ? json.error : "Paiement indisponible");
  };

  const declareCash = async () => {
    if (
      !window.confirm(
        "Confirmez-vous que vous réglerez cette prestation en espèces auprès du prestataire ?"
      )
    ) {
      return;
    }
    setLoading("cash");
    const res = await fetch(`/api/services/quotes/${quoteId}/declare-cash`, {
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      alert(typeof json.error === "string" ? json.error : "Action impossible");
      return;
    }
    router.refresh();
  };

  const showPaymentChoices =
    stripePayable || cashDeclarable || (!payment?.method && amountCents);

  return (
    <div className="rounded-xl border-2 border-accent/30 bg-accent-muted/40 p-4">
      <p className="text-sm font-semibold text-anthracite">Devis accepté</p>
      <p className="mt-0.5 text-xs text-anthracite-600">{serviceTitle}</p>

      {amountCents != null && (
        <p className="mt-2 text-lg font-bold text-accent">
          {formatCents(amountCents)}
        </p>
      )}

      <p className="mt-1 text-xs text-anthracite-500">
        Modalité : {SERVICE_PAYMENT_TIMING_LABELS[timing]}
      </p>

      {payment?.method && (
        <p className="mt-1 text-xs text-anthracite-600">
          Mode choisi : {SERVICE_QUOTE_PAYMENT_METHOD_LABELS[payment.method]}
        </p>
      )}

      {paymentStatus && paymentStatus !== "PENDING" && (
        <p className="mt-1 text-xs font-medium text-green-700">
          {PAYMENT_STATUS_LABELS[
            paymentStatus as keyof typeof PAYMENT_STATUS_LABELS
          ] ?? paymentStatus}
        </p>
      )}

      {showPaymentChoices && (
        <>
          <p className="mt-3 text-sm font-medium text-anthracite">
            Comment souhaitez-vous régler ?
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {stripePayable && (
              <Button
                className="flex-1"
                loading={loading === "pay"}
                onClick={() => void payStripe()}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payer par carte
              </Button>
            )}
            {cashDeclarable && (
              <Button
                className="flex-1"
                variant="outline"
                loading={loading === "cash"}
                onClick={() => void declareCash()}
              >
                <Banknote className="mr-2 h-4 w-4" />
                Payer en espèces
              </Button>
            )}
          </div>
        </>
      )}

      {!amountCents && (
        <p className="mt-3 text-sm text-anthracite-600">
          Le montant n&apos;est pas encore défini. Convenez du tarif avec le
          prestataire via les messages.
        </p>
      )}

      {amountCents && !stripePayable && !cashDeclarable && payment?.method === "CASH" && (
        <p className="mt-3 text-sm text-anthracite-600">
          Paiement en espèces enregistré — le prestataire confirmera la réception.
        </p>
      )}

      {amountCents && !stripePayable && !cashDeclarable && paymentStatus === "HELD" && (
        <p className="mt-3 text-sm text-anthracite-600">
          Paiement en ligne reçu — le prestataire clôturera la prestation.
        </p>
      )}

      {!stripePaymentsEnabled && cashDeclarable && (
        <p className="mt-2 text-xs text-anthracite-400">
          Le paiement par carte sera disponible lorsque Stripe sera activé sur la
          plateforme.
        </p>
      )}

      <Link
        href="/dashboard/bookings?role=services&as=client"
        className="mt-3 inline-block text-xs text-accent hover:underline"
      >
        Voir dans Mes prestations →
      </Link>
    </div>
  );
}

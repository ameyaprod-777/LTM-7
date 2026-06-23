"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServicePaymentTiming, ServiceQuotePaymentMethod } from "@prisma/client";
import {
  SERVICE_PAYMENT_TIMING_LABELS,
  SERVICE_QUOTE_PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import {
  canProviderSettleQuote,
  isAfterServicePeriodEnded,
  settleTimingLabel,
} from "@/lib/service-quote-payment";
import { ServiceQuotePaymentPanel } from "@/components/services/service-quote-payment-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PaymentInfo = {
  status: string;
  method: ServiceQuotePaymentMethod | null;
  clientDeclaredCashAt: string | null;
};

type Props = {
  quoteId: string;
  status: string;
  role: "provider" | "client";
  clientPaymentPreference?: ServicePaymentTiming;
  agreedPaymentTiming?: ServicePaymentTiming | null;
  proposedAmount?: number | null;
  servicePriceAmount?: number | null;
  serviceTitle?: string;
  payment?: PaymentInfo | null;
  stripePaymentsEnabled?: boolean;
  endDate?: string | null;
};

export function ServiceQuoteActions({
  quoteId,
  status,
  role,
  clientPaymentPreference = "UPFRONT",
  agreedPaymentTiming,
  proposedAmount,
  servicePriceAmount,
  serviceTitle = "Prestation",
  payment,
  stripePaymentsEnabled = false,
  endDate,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showReply, setShowReply] = useState(false);

  const paymentStatus = payment?.status ?? null;

  const act = async (
    action: "accept" | "reject",
    acceptAfterPayment?: boolean
  ) => {
    setLoading(action + (acceptAfterPayment ? "-after" : ""));
    const res = await fetch(`/api/services/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        message: message.trim() || undefined,
        ...(action === "accept" && acceptAfterPayment
          ? { acceptAfterPayment: true }
          : {}),
      }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      alert(typeof json.error === "string" ? json.error : "Action impossible");
      return;
    }
    setShowReply(false);
    setMessage("");
    router.refresh();
  };

  const completeQuote = async () => {
    const timing = agreedPaymentTiming ?? "UPFRONT";
    const label = settleTimingLabel(timing);
    if (
      !window.confirm(
        `Confirmer que le règlement a bien été reçu ${label} et clôturer cette prestation ?`
      )
    ) {
      return;
    }
    setLoading("complete");
    const res = await fetch(`/api/services/quotes/${quoteId}/complete`, {
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      alert(typeof json.error === "string" ? json.error : "Clôture impossible");
      return;
    }
    router.refresh();
  };

  const providerCanSettle =
    role === "provider" &&
    status === "ACCEPTED" &&
    canProviderSettleQuote({
      status,
      agreedPaymentTiming: agreedPaymentTiming ?? null,
      startDate: null,
      endDate: endDate ?? null,
      payment: payment ?? null,
    });

  if (role === "provider" && status === "PENDING") {
    const afterRequested = clientPaymentPreference === "AFTER_SERVICE";

    return (
      <div className="w-full min-w-[200px] space-y-2">
        {afterRequested && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Le client demande un{" "}
            <strong>{SERVICE_PAYMENT_TIMING_LABELS.AFTER_SERVICE}</strong>.
            Acceptez uniquement si cela vous convient, sinon refusez la demande.
          </p>
        )}

        {showReply ? (
          <Textarea
            rows={2}
            placeholder="Message optionnel au client…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        ) : (
          <button
            type="button"
            className="text-xs text-accent hover:underline"
            onClick={() => setShowReply(true)}
          >
            Ajouter un message
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          {afterRequested ? (
            <Button
              size="sm"
              loading={loading === "accept-after"}
              onClick={() => void act("accept", true)}
            >
              Accepter paiement après prestation
            </Button>
          ) : (
            <Button
              size="sm"
              loading={loading === "accept"}
              onClick={() => void act("accept")}
            >
              Accepter le devis
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!!loading}
            onClick={() => void act("reject")}
          >
            Refuser
          </Button>
        </div>

        <p className="text-xs text-anthracite-400">
          Les dates seront bloquées dans votre calendrier si vous acceptez.
        </p>
      </div>
    );
  }

  if (role === "client" && status === "PENDING") {
    return (
      <p className="text-xs text-anthracite-500">
        En attente du prestataire ·{" "}
        {SERVICE_PAYMENT_TIMING_LABELS[clientPaymentPreference]} demandé
      </p>
    );
  }

  if (status === "COMPLETED") {
    return (
      <p className="text-xs font-medium text-green-700">
        Prestation terminée
        {payment?.method && (
          <> · {SERVICE_QUOTE_PAYMENT_METHOD_LABELS[payment.method]}</>
        )}
      </p>
    );
  }

  if (role === "client" && status === "ACCEPTED") {
    return (
      <ServiceQuotePaymentPanel
        quoteId={quoteId}
        status={status}
        serviceTitle={serviceTitle}
        proposedAmount={proposedAmount ?? null}
        servicePriceAmount={servicePriceAmount}
        agreedPaymentTiming={agreedPaymentTiming}
        payment={payment}
        stripePaymentsEnabled={stripePaymentsEnabled}
      />
    );
  }

  if (role === "provider" && status === "ACCEPTED") {
    const timing = agreedPaymentTiming ?? "UPFRONT";
    const waitingEnd =
      timing === "AFTER_SERVICE" && !isAfterServicePeriodEnded(endDate ?? null);

    return (
      <div className="space-y-2">
        {payment?.method && (
          <p className="text-xs text-anthracite-600">
            {SERVICE_QUOTE_PAYMENT_METHOD_LABELS[payment.method]}
            {paymentStatus === "HELD" && " · payé en ligne"}
            {payment.method === "CASH" && payment.clientDeclaredCashAt && (
              <> · espèces déclarées par le client</>
            )}
          </p>
        )}

        {waitingEnd && (
          <p className="text-xs text-amber-800">
            Confirmation du règlement possible à la fin du projet (
            {endDate ? `après le ${endDate}` : "à la clôture"}).
          </p>
        )}

        {providerCanSettle && (
          <Button
            size="sm"
            loading={loading === "complete"}
            onClick={() => void completeQuote()}
          >
            {timing === "UPFRONT"
              ? "Règlement reçu (début) — clôturer"
              : "Règlement reçu (fin) — clôturer"}
          </Button>
        )}

        {!providerCanSettle && !waitingEnd && (
          <p className="text-xs text-anthracite-400">
            En attente du paiement du client (carte ou espèces).
          </p>
        )}
      </div>
    );
  }

  if (
    role === "client" &&
    status === "REJECTED" &&
    clientPaymentPreference === "AFTER_SERVICE"
  ) {
    return (
      <p className="text-xs text-anthracite-500">
        Refusé — vous pouvez renvoyer une demande avec paiement direct.
      </p>
    );
  }

  return null;
}

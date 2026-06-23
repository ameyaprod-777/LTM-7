"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import type { ServicePaymentTiming, ServiceRateType } from "@prisma/client";
import { SERVICE_PAYMENT_TIMING_LABELS } from "@/lib/constants";
import { formatApiError } from "@/lib/zod-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  serviceId: string;
  serviceTitle: string;
  rateType: ServiceRateType;
};

export function ServiceQuoteRequest({ serviceId, serviceTitle, rateType }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [proposedAmount, setProposedAmount] = useState("");
  const [scopeImageRights, setScopeImageRights] = useState(false);
  const [scopeScheduleAgreed, setScopeScheduleAgreed] = useState(false);
  const [scopeDeliverablesAgreed, setScopeDeliverablesAgreed] = useState(false);
  const [acceptServiceTerms, setAcceptServiceTerms] = useState(false);
  const [paymentPreference, setPaymentPreference] =
    useState<ServicePaymentTiming>("UPFRONT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsDates = rateType !== "PROJECT";

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      brief: brief.trim(),
      scopeImageRights,
      scopeScheduleAgreed,
      scopeDeliverablesAgreed,
      acceptServiceTerms,
      paymentPreference,
    };

    if (startDate) payload.startDate = startDate;
    if (endDate) payload.endDate = endDate;

    if (rateType === "PROJECT" && proposedAmount.trim()) {
      const normalized = proposedAmount.trim().replace(",", ".");
      const n = Number(normalized);
      if (!Number.isNaN(n) && n > 0) {
        payload.proposedAmount = n;
      }
    }

    return payload;
  };

  const validateClient = (): string | null => {
    if (brief.trim().length < 20) {
      return "Décrivez votre besoin en au moins 20 caractères.";
    }
    if (needsDates && (!startDate || !endDate)) {
      return "Indiquez les dates de début et de fin.";
    }
    if (needsDates && endDate < startDate) {
      return "La date de fin doit être après la date de début.";
    }
    if (!acceptServiceTerms) {
      return "Vous devez accepter le périmètre de prestation.";
    }
    return null;
  };

  const submit = async () => {
    const clientError = validateClient();
    if (clientError) {
      setError(clientError);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/services/${serviceId}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(formatApiError(json.error));
      return;
    }

    router.push(`/dashboard/messages/${json.conversationId}`);
    router.refresh();
  };

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        Demander un devis
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="quote-brief">Description du besoin *</Label>
        <Textarea
          id="quote-brief"
          rows={4}
          className="mt-2"
          placeholder={`Décrivez votre projet pour « ${serviceTitle} »…`}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
        <p className="mt-1 text-xs text-anthracite-400">Minimum 20 caractères</p>
      </div>

      {needsDates ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="quote-start">Date de début *</Label>
            <Input
              id="quote-start"
              type="date"
              className="mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="quote-end">Date de fin *</Label>
            <Input
              id="quote-end"
              type="date"
              className="mt-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="quote-start">Début souhaité (optionnel)</Label>
            <Input
              id="quote-start"
              type="date"
              className="mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="quote-budget">Budget indicatif (€)</Label>
            <Input
              id="quote-budget"
              type="number"
              step="0.01"
              min="0"
              className="mt-1"
              value={proposedAmount}
              onChange={(e) => setProposedAmount(e.target.value)}
            />
          </div>
        </div>
      )}

      <fieldset className="space-y-2 rounded-lg border border-anthracite-100 p-3">
        <legend className="text-sm font-medium text-anthracite">
          Mode de paiement
        </legend>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="radio"
            name="payment-preference"
            checked={paymentPreference === "UPFRONT"}
            onChange={() => setPaymentPreference("UPFRONT")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">
              {SERVICE_PAYMENT_TIMING_LABELS.UPFRONT}
            </span>
            <span className="block text-anthracite-500">
              Paiement en ligne dès que le prestataire accepte le devis.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="radio"
            name="payment-preference"
            checked={paymentPreference === "AFTER_SERVICE"}
            onChange={() => setPaymentPreference("AFTER_SERVICE")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">
              {SERVICE_PAYMENT_TIMING_LABELS.AFTER_SERVICE}
            </span>
            <span className="block text-anthracite-500">
              Le prestataire pourra accepter ou refuser cette modalité.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-2 rounded-lg border border-anthracite-100 p-3">
        <legend className="text-sm font-medium text-anthracite">
          Périmètre de prestation
        </legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={scopeImageRights}
            onChange={(e) => setScopeImageRights(e.target.checked)}
            className="mt-1"
          />
          Droits d&apos;utilisation des images / vidéos convenus
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={scopeScheduleAgreed}
            onChange={(e) => setScopeScheduleAgreed(e.target.checked)}
            className="mt-1"
          />
          Horaires et lieu d&apos;intervention définis
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={scopeDeliverablesAgreed}
            onChange={(e) => setScopeDeliverablesAgreed(e.target.checked)}
            className="mt-1"
          />
          Livrables et délais précisés
        </label>
        <label className="flex items-start gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={acceptServiceTerms}
            onChange={(e) => setAcceptServiceTerms(e.target.checked)}
            className="mt-1"
          />
          J&apos;accepte le périmètre ci-dessus pour cette demande *
        </label>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setOpen(false)}
        >
          Annuler
        </Button>
        <Button
          type="button"
          className="flex-1"
          loading={loading}
          onClick={() => void submit()}
        >
          Envoyer la demande
        </Button>
      </div>
    </div>
  );
}

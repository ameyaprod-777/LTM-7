"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeliveryOption, DeliverySlot } from "@prisma/client";
import { formatCents } from "@/lib/money";
import { DELIVERY_SLOT_LABELS } from "@/lib/constants";
import { BookingMaterialConsent } from "@/components/legal/legal-consent-checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";

type Props = {
  listingId: string;
  pricePerDay: number;
  deliveryOption: DeliveryOption;
  deliveryFlatFee: number | null;
  deliveryFeePerKm: number | null;
  deliveryRadiusKm: number | null;
  deliveryPricingType: string | null;
  deliverySlots: DeliverySlot[];
  paymentsAvailable?: boolean;
};

export function BookingForm({
  listingId,
  pricePerDay,
  deliveryOption,
  deliveryFlatFee,
  deliveryFeePerKm,
  deliveryRadiusKm,
  deliveryPricingType,
  deliverySlots,
  paymentsAvailable = true,
}: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mode, setMode] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot | "">("");
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptMaterialTerms, setAcceptMaterialTerms] = useState(false);
  const [materialError, setMaterialError] = useState<string | undefined>();

  const canDeliver =
    deliveryOption === "DELIVERY_AVAILABLE" || deliveryOption === "BOTH";

  const estimatedDeliveryFee =
    mode === "delivery"
      ? deliveryPricingType === "PER_KM" &&
        deliveryFeePerKm &&
        deliveryRadiusKm
        ? Math.round(deliveryFeePerKm * deliveryRadiusKm)
        : deliveryFlatFee ?? 0
      : 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMaterialError(undefined);

    if (!acceptMaterialTerms) {
      setMaterialError(
        "Vous devez accepter la charte responsabilité matériel pour réserver."
      );
      setLoading(false);
      return;
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        startDate,
        endDate,
        pickupOrDelivery: mode,
        deliveryAddress: mode === "delivery" ? address : undefined,
        deliverySlot: deliverySlot || undefined,
        acceptMaterialTerms: true,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Impossible d'envoyer la demande";
      setError(msg);
      toastError(msg);
      return;
    }

    success("Demande de réservation envoyée");
    if (json.conversationId) {
      router.push(`/dashboard/messages/${json.conversationId}`);
    } else {
      router.push("/dashboard/bookings");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-anthracite-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-anthracite">Réserver</h3>
      <p className="text-sm text-anthracite-500">
        À partir de {formatCents(pricePerDay)} / jour
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Début</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <Label>Fin</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>

      {canDeliver && (
        <div className="space-y-2">
          <Label>Mode</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("pickup")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === "pickup" ? "border-accent bg-accent-muted text-accent" : "border-anthracite-200"}`}
            >
              Retrait
            </button>
            <button
              type="button"
              onClick={() => setMode("delivery")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === "delivery" ? "border-accent bg-accent-muted text-accent" : "border-anthracite-200"}`}
            >
              Livraison
              {estimatedDeliveryFee > 0
                ? ` (+${formatCents(estimatedDeliveryFee)})`
                : ""}
            </button>
          </div>
          {mode === "delivery" && (
            <>
              <Input
                placeholder="Adresse de livraison"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              {deliverySlots.length > 0 && (
                <div>
                  <Label>Créneau souhaité</Label>
                  <select
                    className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
                    value={deliverySlot}
                    onChange={(e) =>
                      setDeliverySlot(e.target.value as DeliverySlot)
                    }
                  >
                    <option value="">— Choisir —</option>
                    {deliverySlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {DELIVERY_SLOT_LABELS[slot]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <BookingMaterialConsent
        checked={acceptMaterialTerms}
        onChange={setAcceptMaterialTerms}
        error={materialError}
      />

      {!paymentsAvailable && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          Les paiements en ligne ne sont pas encore activés. La réservation en ligne
          sera disponible prochainement.
        </p>
      )}
      <p className="text-xs text-anthracite-400">
        Le loueur devra approuver votre demande avant tout paiement. Une conversation
        sera ouverte pour organiser la location.
      </p>
      <Button
        type="submit"
        className="w-full"
        loading={loading}
        disabled={!paymentsAvailable}
      >
        Envoyer une demande de réservation
      </Button>
    </form>
  );
}

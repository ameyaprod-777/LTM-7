"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DAMAGE_TYPES } from "@/lib/validations/damage-report";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function DamageReportDialog({
  bookingId,
  listingTitle,
}: {
  bookingId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [damageType, setDamageType] = useState<keyof typeof DAMAGE_TYPES>("SCRATCH");
  const [description, setDescription] = useState("");
  const [estimatedCostEuros, setEstimatedCostEuros] = useState("");

  const submit = async () => {
    if (description.trim().length < 20) {
      setError("Décrivez le sinistre en au moins 20 caractères.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "report_damage",
        damageType,
        description: description.trim(),
        estimatedCostEuros: estimatedCostEuros
          ? Number(estimatedCostEuros)
          : undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(
        typeof json.error === "string"
          ? json.error
          : "Impossible d'enregistrer le signalement."
      );
      return;
    }
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-red-200 text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        Déclarer un sinistre
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-red-200 bg-red-50/50 p-4 text-left">
      <h3 className="text-sm font-semibold text-red-900">
        Sinistre matériel — {listingTitle}
      </h3>
      <p className="mt-1 text-xs text-red-800/80">
        Un ticket support sera créé et la réservation passera en litige. Joignez
        des photos via le ticket si besoin.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <Label>Type de dommage</Label>
          <select
            className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
            value={damageType}
            onChange={(e) =>
              setDamageType(e.target.value as keyof typeof DAMAGE_TYPES)
            }
          >
            {Object.entries(DAMAGE_TYPES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Description détaillée *</Label>
          <Textarea
            rows={4}
            className="mt-1 bg-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Circonstances, état constaté, références photos…"
          />
        </div>
        <div>
          <Label>Coût estimé (€, optionnel)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            className="mt-1 bg-white"
            value={estimatedCostEuros}
            onChange={(e) => setEstimatedCostEuros(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            loading={loading}
            onClick={() => void submit()}
          >
            Envoyer le signalement
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}

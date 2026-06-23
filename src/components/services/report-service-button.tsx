"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ReportServiceButton({ serviceId }: { serviceId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/services/${serviceId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(typeof json.error === "string" ? json.error : "Erreur");
      return;
    }
    setDone(true);
    setOpen(false);
  };

  if (done) {
    return (
      <p className="text-sm text-green-700">Signalement envoyé — merci.</p>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-anthracite-500"
        onClick={() => setOpen(!open)}
      >
        <Flag className="mr-2 h-4 w-4" />
        Signaler ce service
      </Button>
      {open && (
        <div className="mt-3 rounded-xl border border-anthracite-100 bg-white p-4 shadow-sm">
          <Label>Motif du signalement</Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
            placeholder="Décrivez le problème…"
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <Button
            type="button"
            size="sm"
            className="mt-3"
            loading={loading}
            onClick={submit}
          >
            Envoyer
          </Button>
        </div>
      )}
    </div>
  );
}

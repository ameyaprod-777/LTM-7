"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";

type PayoutRow = {
  paymentId: string;
  bookingId: string;
  listingTitle: string;
  listingId: string;
  amountCents: number;
  commissionCents: number;
  totalPaidCents: number;
  completedAt: string | null;
  releasedAt: string | null;
  manualPayoutStatus: "PENDING" | "PAID" | null;
  manualPayoutPaidAt: string | null;
  manualPayoutNote: string | null;
  lister: {
    id: string;
    name: string | null;
    email: string;
    holderName: string | null;
    ibanMasked: string;
    ibanFull: string | null;
  };
};

export function AdminPayoutsPanel() {
  const [tab, setTab] = useState<"PENDING" | "PAID">("PENDING");
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (status: "PENDING" | "PAID") => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/payouts?status=${status}`);
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur");
      return;
    }
    setRows(json as PayoutRow[]);
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const markPaid = async (paymentId: string) => {
    const note = window.prompt(
      "Référence du virement (optionnel) — ex. SEPA-2026-…"
    );
    if (note === null) return;
    setActing(paymentId);
    const res = await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, note: note || undefined }),
    });
    setActing(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(typeof json.error === "string" ? json.error : "Échec");
      return;
    }
    void load(tab);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "PENDING" ? "primary" : "outline"}
          onClick={() => setTab("PENDING")}
        >
          À virer
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "PAID" ? "primary" : "outline"}
          onClick={() => setTab("PAID")}
        >
          Déjà versés
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-anthracite-400">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-anthracite-200 px-4 py-8 text-center text-sm text-anthracite-400">
          Aucun virement {tab === "PENDING" ? "en attente" : "terminé"}.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.paymentId}
              className="rounded-xl border border-anthracite-100 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-anthracite">
                    {row.listingTitle}
                  </p>
                  <p className="mt-1 text-sm text-anthracite-500">
                    {row.lister.name ?? "Loueur"} · {row.lister.email}
                  </p>
                  <p className="mt-2 text-lg font-bold text-accent">
                    {formatCents(row.amountCents)}
                  </p>
                  <p className="text-xs text-anthracite-400">
                    Commission plateforme : {formatCents(row.commissionCents)} ·
                    Total encaissé : {formatCents(row.totalPaidCents)}
                  </p>
                </div>
                {tab === "PENDING" && (
                  <Button
                    type="button"
                    loading={acting === row.paymentId}
                    onClick={() => void markPaid(row.paymentId)}
                  >
                    Marquer versé
                  </Button>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-anthracite-50 px-3 py-3 font-mono text-sm">
                <p className="text-xs font-sans uppercase tracking-wide text-anthracite-400">
                  IBAN à créditer
                </p>
                <p className="mt-1 text-anthracite">
                  {row.lister.holderName ?? "—"}
                </p>
                <p className="mt-1 break-all text-anthracite-700">
                  {row.lister.ibanFull ?? row.lister.ibanMasked}
                </p>
              </div>

              {row.manualPayoutNote && (
                <p className="mt-2 text-xs text-anthracite-500">
                  Note : {row.manualPayoutNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

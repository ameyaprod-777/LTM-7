"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import { SERVICE_PAYMENT_TIMING_LABELS } from "@/lib/constants";
import type { ServicePaymentTiming } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Quote = {
  id: string;
  status: string;
  brief: string;
  startDate: string | null;
  endDate: string | null;
  proposedAmount: number | null;
  clientPaymentPreference: ServicePaymentTiming;
  createdAt: string;
  client: { id: string; name: string | null };
  conversationId: string | null;
};

export function ServiceQuotesPanel({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/services/${serviceId}/quotes`);
    const json = await res.json();
    setLoading(false);
    if (res.ok) setQuotes(json);
  }, [serviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    quoteId: string,
    action: "accept" | "reject",
    acceptAfterPayment?: boolean
  ) => {
    setActionId(quoteId);
    await fetch(`/api/services/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        message: messages[quoteId] || undefined,
        ...(action === "accept" && acceptAfterPayment
          ? { acceptAfterPayment: true }
          : {}),
      }),
    });
    setActionId(null);
    void load();
    router.refresh();
  };

  const pending = quotes.filter((q) => q.status === "PENDING");

  return (
    <div id="devis" className="mt-12 scroll-mt-24">
      <h2 className="text-xl font-semibold text-anthracite">
        Demandes de devis
        {pending.length > 0 && (
          <span className="ml-2 rounded-full bg-accent-muted px-2 py-0.5 text-sm text-accent">
            {pending.length} en attente
          </span>
        )}
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-anthracite-400">Chargement…</p>
      ) : quotes.length === 0 ? (
        <p className="mt-4 text-sm text-anthracite-400">Aucune demande pour le moment.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {quotes.map((q) => (
            <li
              key={q.id}
              className="rounded-xl border border-anthracite-100 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-anthracite">
                    {q.client.name ?? "Membre"}
                  </p>
                  <p className="text-xs text-anthracite-400">
                    {formatDate(q.createdAt)}
                    {q.startDate && q.endDate && (
                      <> · {q.startDate} → {q.endDate}</>
                    )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    q.status === "PENDING"
                      ? "bg-amber-100 text-amber-900"
                      : q.status === "ACCEPTED"
                        ? "bg-green-100 text-green-800"
                        : "bg-anthracite-100 text-anthracite-600"
                  }`}
                >
                  {q.status === "PENDING"
                    ? "En attente"
                    : q.status === "ACCEPTED"
                      ? "Accepté"
                      : q.status === "REJECTED"
                        ? "Refusé"
                        : q.status}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-anthracite-600">
                {q.brief}
              </p>
              {q.proposedAmount != null && (
                <p className="mt-1 text-sm font-medium text-accent">
                  {formatCents(q.proposedAmount)}
                </p>
              )}
              <p className="mt-1 text-xs text-anthracite-500">
                Paiement demandé :{" "}
                {SERVICE_PAYMENT_TIMING_LABELS[q.clientPaymentPreference]}
              </p>
              {q.conversationId && (
                <Link
                  href={`/dashboard/messages/${q.conversationId}`}
                  className="mt-2 inline-block text-xs text-accent hover:underline"
                >
                  Voir la conversation
                </Link>
              )}
              {q.status === "PENDING" && (
                <div className="mt-4 space-y-2 border-t border-anthracite-50 pt-4">
                  <Textarea
                    rows={2}
                    placeholder="Message optionnel au client…"
                    value={messages[q.id] ?? ""}
                    onChange={(e) =>
                      setMessages({ ...messages, [q.id]: e.target.value })
                    }
                  />
                  {q.clientPaymentPreference === "AFTER_SERVICE" && (
                    <p className="text-xs text-amber-800">
                      Le client souhaite payer après la prestation.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {q.clientPaymentPreference === "AFTER_SERVICE" ? (
                      <Button
                        size="sm"
                        loading={actionId === q.id}
                        onClick={() => void act(q.id, "accept", true)}
                      >
                        Accepter paiement après prestation
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        loading={actionId === q.id}
                        onClick={() => void act(q.id, "accept")}
                      >
                        Accepter
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionId === q.id}
                      onClick={() => void act(q.id, "reject")}
                    >
                      Refuser
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

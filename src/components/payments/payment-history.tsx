"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import {
  PAYMENT_STATUS_LABELS,
  SERVICE_QUOTE_PAYMENT_METHOD_LABELS,
} from "@/lib/constants";

type ListingTx = {
  kind: "listing";
  bookingId: string;
  listingTitle: string;
  listingId: string;
  amount: number;
  refundAmount: number | null;
  status: keyof typeof PAYMENT_STATUS_LABELS;
  bookingStatus: string;
  createdAt: string;
  releasedAt: string | null;
};

type ServiceTx = {
  kind: "service";
  quoteId: string;
  serviceTitle: string;
  serviceId: string;
  amount: number;
  totalAmount?: number;
  method: keyof typeof SERVICE_QUOTE_PAYMENT_METHOD_LABELS | null;
  status: keyof typeof PAYMENT_STATUS_LABELS;
  createdAt: string;
  releasedAt: string | null;
};

type Tx = ListingTx | ServiceTx;

type Role = "renter" | "lister" | "provider" | "service-client";

export function PaymentHistory({ role }: { role: Role }) {
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/payments?role=${role}`)
      .then((r) => r.json())
      .then((json) => {
        setItems(json);
        setLoading(false);
      });
  }, [role]);

  if (loading) {
    return <p className="text-sm text-anthracite-400">Chargement…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-anthracite-400">
        Aucune transaction pour le moment.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((tx) =>
        tx.kind === "listing" ? (
          <li
            key={tx.bookingId}
            className="rounded-xl border border-anthracite-100 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-anthracite-400">Location</p>
                <Link
                  href={`/listings/${tx.listingId}`}
                  className="font-medium text-anthracite hover:text-accent"
                >
                  {tx.listingTitle}
                </Link>
                <p className="text-xs text-anthracite-400">
                  {formatDate(tx.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">{formatCents(tx.amount)}</p>
                <p className="text-xs text-anthracite-500">
                  {PAYMENT_STATUS_LABELS[tx.status]}
                </p>
              </div>
            </div>
            {tx.refundAmount != null && tx.refundAmount > 0 && (
              <p className="mt-1 text-xs text-green-700">
                Remboursé : {formatCents(tx.refundAmount)}
              </p>
            )}
          </li>
        ) : (
          <li
            key={tx.quoteId}
            className="rounded-xl border border-anthracite-100 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-anthracite-400">Prestation</p>
                <Link
                  href={`/services/${tx.serviceId}`}
                  className="font-medium text-anthracite hover:text-accent"
                >
                  {tx.serviceTitle}
                </Link>
                <p className="text-xs text-anthracite-400">
                  {formatDate(tx.createdAt)}
                  {tx.method && (
                    <> · {SERVICE_QUOTE_PAYMENT_METHOD_LABELS[tx.method]}</>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">{formatCents(tx.amount)}</p>
                <p className="text-xs text-anthracite-500">
                  {PAYMENT_STATUS_LABELS[tx.status]}
                </p>
              </div>
            </div>
          </li>
        )
      )}
    </ul>
  );
}

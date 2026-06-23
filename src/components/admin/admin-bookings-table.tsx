"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { BookingStatus, PaymentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  totalAmount: number;
  commissionFee: number;
  listing: { id: string; title: string };
  renter: { id: string; name: string | null; email: string };
  lister: { id: string; name: string | null; email: string };
  payment: { status: PaymentStatus } | null;
};

export function AdminBookingsTable({ bookings }: { bookings: Row[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const action = async (id: string, act: string) => {
    setLoadingId(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });
    setLoadingId(null);
    router.refresh();
  };

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="bg-anthracite-50 text-anthracite-500">
          <tr>
            <th className="px-4 py-3">Réservation</th>
            <th className="px-4 py-3">Parties</th>
            <th className="px-4 py-3">Montants</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t border-anthracite-50">
              <td className="px-4 py-3">
                <Link href={`/listings/${b.listing.id}`} className="font-medium hover:text-accent">
                  {b.listing.title}
                </Link>
                <p className="text-xs text-anthracite-400">
                  {formatDate(b.startDate)} → {formatDate(b.endDate)}
                </p>
              </td>
              <td className="px-4 py-3 text-xs text-anthracite-600">
                <p>Loc. {b.renter.name ?? b.renter.email}</p>
                <p>Loueur {b.lister.name ?? b.lister.email}</p>
              </td>
              <td className="px-4 py-3 text-xs">
                <p>{formatCents(b.totalAmount)}</p>
                <p className="text-anthracite-400">
                  Commission {formatCents(b.commissionFee)}
                </p>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-anthracite-100 px-2 py-0.5 text-xs">
                  {BOOKING_STATUS_LABELS[b.status]}
                </span>
                {b.payment && (
                  <p className="mt-1 text-xs text-anthracite-500">
                    {PAYMENT_STATUS_LABELS[b.payment.status]}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {b.status === "DISPUTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === b.id}
                      onClick={() => void action(b.id, "resolve_dispute")}
                    >
                      Lever litige
                    </Button>
                  )}
                  {["CONFIRMED", "ACTIVE"].includes(b.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === b.id}
                      onClick={() => void action(b.id, "complete")}
                    >
                      Clôturer
                    </Button>
                  )}
                  {b.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === b.id}
                      onClick={() => void action(b.id, "activate")}
                    >
                      Activer
                    </Button>
                  )}
                  {!["CANCELLED", "COMPLETED"].includes(b.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === b.id}
                      onClick={() => void action(b.id, "cancel")}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <p className="py-12 text-center text-anthracite-400">Aucune réservation.</p>
      )}
    </div>
  );
}

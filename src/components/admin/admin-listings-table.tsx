"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import type { ListingStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";

type ListingRow = {
  id: string;
  title: string;
  status: ListingStatus;
  city: string;
  pricePerDay: number;
  viewCount: number;
  photos: { url: string }[];
  owner: { id: string; name: string | null; email: string };
  _count: { bookings: number; reports: number };
};

export function AdminListingsTable({ listings }: { listings: ListingRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const setStatus = async (id: string, status: ListingStatus) => {
    setLoadingId(id);
    await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    router.refresh();
  };

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-anthracite-50 text-anthracite-500">
          <tr>
            <th className="px-4 py-3">Annonce</th>
            <th className="px-4 py-3">Loueur</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Stats</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id} className="border-t border-anthracite-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {l.photos[0] ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Image src={l.photos[0].url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-anthracite-100 text-xs">
                      —
                    </span>
                  )}
                  <div>
                    <Link href={`/listings/${l.id}`} className="font-medium hover:text-accent">
                      {l.title}
                    </Link>
                    <p className="text-xs text-anthracite-400">
                      {l.city} · {formatCents(l.pricePerDay)}/j
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/users/${l.owner.id}`} className="hover:text-accent">
                  {l.owner.name ?? l.owner.email}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-anthracite-100 px-2 py-0.5 text-xs">
                  {LISTING_STATUS_LABELS[l.status]}
                </span>
                {l._count.reports > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    {l._count.reports} signalement{l._count.reports > 1 ? "s" : ""}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-anthracite-500">
                {l.viewCount} vues · {l._count.bookings} résa.
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {l.status !== "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loadingId === l.id}
                      onClick={() => void setStatus(l.id, "ACTIVE")}
                    >
                      Activer
                    </Button>
                  )}
                  {l.status !== "PAUSED" && l.status !== "REMOVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loadingId === l.id}
                      onClick={() => void setStatus(l.id, "PAUSED")}
                    >
                      Pause
                    </Button>
                  )}
                  {l.status !== "REMOVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loadingId === l.id}
                      onClick={() => void setStatus(l.id, "REMOVED")}
                    >
                      Masquer
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {listings.length === 0 && (
        <p className="py-12 text-center text-anthracite-400">Aucune annonce.</p>
      )}
    </div>
  );
}

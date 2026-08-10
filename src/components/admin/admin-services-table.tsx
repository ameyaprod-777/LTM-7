"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import type { ListingStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toSameOriginMediaUrl } from "@/lib/upload-root";
type ServiceRow = {
  id: string;
  title: string;
  status: ListingStatus;
  city: string;
  priceAmount: number;
  viewCount: number;
  photos: { url: string }[];
  owner: { id: string; name: string | null; email: string };
  _count: { quotes: number; reports: number };
};

export function AdminServicesTable({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const setStatus = async (id: string, status: ListingStatus) => {
    setLoadingId(id);
    await fetch(`/api/admin/services/${id}`, {
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
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Prestataire</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Stats</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-t border-anthracite-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {s.photos[0] ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={
                          toSameOriginMediaUrl(s.photos[0].url) ?? s.photos[0].url
                        }
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-anthracite-100 text-xs">
                      —
                    </span>
                  )}
                  <div>
                    <Link href={`/services/${s.id}`} className="font-medium hover:text-accent">
                      {s.title}
                    </Link>
                    <p className="text-xs text-anthracite-400">{s.city}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/users/${s.owner.id}`} className="hover:text-accent">
                  {s.owner.name ?? s.owner.email}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-anthracite-100 px-2 py-0.5 text-xs">
                  {LISTING_STATUS_LABELS[s.status]}
                </span>
                {s._count.reports > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    {s._count.reports} signalement{s._count.reports > 1 ? "s" : ""}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-anthracite-500">
                {s.viewCount} vues · {s._count.quotes} devis
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {s.status !== "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loadingId === s.id}
                      onClick={() => void setStatus(s.id, "ACTIVE")}
                    >
                      Activer
                    </Button>
                  )}
                  {s.status !== "PAUSED" && s.status !== "REMOVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loadingId === s.id}
                      onClick={() => void setStatus(s.id, "PAUSED")}
                    >
                      Pause
                    </Button>
                  )}
                  {s.status !== "REMOVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loadingId === s.id}
                      onClick={() => void setStatus(s.id, "REMOVED")}
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
      {services.length === 0 && (
        <p className="py-12 text-center text-anthracite-400">Aucun service.</p>
      )}
    </div>
  );
}

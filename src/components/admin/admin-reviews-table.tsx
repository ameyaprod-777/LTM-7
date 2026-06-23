"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flag, Trash2, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  rating: number;
  equipmentRating: number | null;
  comment: string | null;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
  author: { name: string | null; email: string };
  target: { name: string | null; id: string };
  booking: { listing: { title: string } };
};

export function AdminReviewsTable({ reviews }: { reviews: Row[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const unflag = async (id: string) => {
    setLoadingId(id);
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged: false }),
    });
    setLoadingId(null);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cet avis ?")) return;
    setLoadingId(id);
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    setLoadingId(null);
    router.refresh();
  };

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-anthracite-50 text-anthracite-500">
          <tr>
            <th className="px-4 py-3">Avis</th>
            <th className="px-4 py-3">Auteur → Cible</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr
              key={r.id}
              className={`border-t border-anthracite-50 ${r.flagged ? "bg-red-50/50" : ""}`}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-anthracite">
                  {r.booking.listing.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-anthracite-500">
                  {r.comment ?? "—"}
                </p>
                <p className="text-xs text-anthracite-400">{formatDate(r.createdAt)}</p>
              </td>
              <td className="px-4 py-3 text-anthracite-600">
                {r.author.name ?? r.author.email}
                <br />
                <span className="text-anthracite-400">→</span>{" "}
                <Link href={`/profile/${r.target.id}`} className="hover:text-accent">
                  {r.target.name ?? "Membre"}
                </Link>
              </td>
              <td className="px-4 py-3 text-xs">
                Pers. {r.rating}/5
                {r.equipmentRating != null && (
                  <>
                    <br />
                    Mat. {r.equipmentRating}/5
                  </>
                )}
              </td>
              <td className="px-4 py-3">
                {r.flagged ? (
                  <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">
                    <Flag className="h-3 w-3" />
                    Signalé
                  </span>
                ) : (
                  <span className="text-xs text-anthracite-400">OK</span>
                )}
                {r.flagReason && (
                  <p className="mt-1 max-w-[200px] truncate text-xs text-red-700">
                    {r.flagReason}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {r.flagged && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === r.id}
                      onClick={() => void unflag(r.id)}
                      title="Retirer le signalement"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === r.id}
                    onClick={() => void remove(r.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reviews.length === 0 && (
        <p className="py-12 text-center text-anthracite-400">Aucun avis.</p>
      )}
    </div>
  );
}

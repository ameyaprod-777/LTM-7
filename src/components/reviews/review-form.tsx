"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function ReviewForm({
  bookingId,
  showEquipmentReview = false,
}: {
  bookingId: string;
  showEquipmentReview?: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [equipmentRating, setEquipmentRating] = useState(5);
  const [equipmentComment, setEquipmentComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        rating,
        comment: comment || undefined,
        ...(showEquipmentReview
          ? {
              equipmentRating,
              equipmentComment: equipmentComment || undefined,
            }
          : {}),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(typeof json.error === "string" ? json.error : "Échec de l'envoi");
      return;
    }
    router.refresh();
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-anthracite-100 p-4">
      <div>
        <p className="text-sm font-medium text-anthracite">Avis sur la personne</p>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-2 rounded border border-anthracite-200 px-2 py-1 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} étoile{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Commentaire sur l'échange (optionnel)…"
          className="mt-2 w-full rounded border border-anthracite-200 px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      {showEquipmentReview && (
        <div className="border-t border-anthracite-100 pt-4">
          <p className="text-sm font-medium text-anthracite">Avis sur le matériel</p>
          <p className="mt-0.5 text-xs text-anthracite-500">
            État, qualité, conformité du matériel loué
          </p>
          <select
            value={equipmentRating}
            onChange={(e) => setEquipmentRating(Number(e.target.value))}
            className="mt-2 rounded border border-anthracite-200 px-2 py-1 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} étoile{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <textarea
            value={equipmentComment}
            onChange={(e) => setEquipmentComment(e.target.value)}
            placeholder="Ex. FX3 en bon état, optiques nickel…"
            className="mt-2 w-full rounded border border-anthracite-200 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button size="sm" loading={loading} onClick={submit}>
        Publier l&apos;avis
      </Button>
    </div>
  );
}

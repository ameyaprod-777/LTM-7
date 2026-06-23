"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReviewResponseForm({
  reviewId,
  initialResponse,
}: {
  reviewId: string;
  initialResponse?: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!initialResponse);
  const [response, setResponse] = useState(initialResponse ?? "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    setLoading(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  };

  if (!editing && initialResponse) {
    return (
      <div className="mt-3 rounded-lg bg-anthracite-50 px-3 py-2 text-sm text-anthracite-700">
        <p className="text-xs font-medium text-anthracite-500">Votre réponse publique</p>
        <p className="mt-1 whitespace-pre-wrap">{initialResponse}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setEditing(true)}
        >
          Modifier la réponse
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-anthracite-500">Répondre publiquement</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        placeholder="Remerciements, précisions…"
      />
      <div className="flex gap-2">
        <Button size="sm" loading={loading} onClick={save}>
          Publier
        </Button>
        {initialResponse && (
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
}

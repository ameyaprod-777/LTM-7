"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy } from "lucide-react";
import type { ListingStatus } from "@prisma/client";
import { DeleteResourceButton } from "@/components/dashboard/delete-resource-button";

export function ListingRowActions({
  listingId,
  title,
  status,
}: {
  listingId: string;
  title: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const duplicate = async () => {
    setLoading("duplicate");
    const res = await fetch(`/api/listings/${listingId}/duplicate`, {
      method: "POST",
    });
    const json = await res.json();
    setLoading(null);
    if (res.ok) {
      router.push(`/listings/${json.id}/edit`);
    }
  };

  const setStatus = async (next: ListingStatus) => {
    setLoading(next);
    const res = await fetch(`/api/listings/${listingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(null);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        redirectTo?: string;
      };
      if (json.code === "STRIPE_CONNECT_REQUIRED" && json.redirectTo) {
        router.push(json.redirectTo);
        return;
      }
      window.alert(
        typeof json.error === "string"
          ? json.error
          : "Impossible de mettre à jour le statut."
      );
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/listings/${listingId}/edit`}
        className="text-sm text-accent hover:underline"
      >
        Modifier
      </Link>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-anthracite-500 hover:text-accent disabled:opacity-50"
        disabled={loading === "duplicate"}
        onClick={() => void duplicate()}
      >
        <Copy className="h-3.5 w-3.5" />
        Dupliquer
      </button>
      {status === "ACTIVE" && (
        <button
          type="button"
          className="text-sm text-anthracite-500 hover:underline disabled:opacity-50"
          disabled={!!loading}
          onClick={() => void setStatus("PAUSED")}
        >
          Pause
        </button>
      )}
      {status === "PAUSED" && (
        <button
          type="button"
          className="text-sm text-accent hover:underline disabled:opacity-50"
          disabled={!!loading}
          onClick={() => void setStatus("ACTIVE")}
        >
          Réactiver
        </button>
      )}
      {status === "DRAFT" && (
        <>
          <button
            type="button"
            className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
            disabled={!!loading}
            onClick={() => void setStatus("ACTIVE")}
          >
            Publier
          </button>
          <span className="text-xs text-anthracite-400">(brouillon)</span>
        </>
      )}
      <DeleteResourceButton
        kind="listing"
        resourceId={listingId}
        title={title}
      />
    </div>
  );
}

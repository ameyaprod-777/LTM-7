"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

type ResourceKind = "listing" | "service";

const LABELS: Record<
  ResourceKind,
  { noun: string; apiPath: (id: string) => string; redirect: string }
> = {
  listing: {
    noun: "Cette annonce",
    apiPath: (id) => `/api/listings/${id}`,
    redirect: "/dashboard/listings",
  },
  service: {
    noun: "Ce service",
    apiPath: (id) => `/api/services/${id}`,
    redirect: "/dashboard/services",
  },
};

type Props = {
  kind: ResourceKind;
  resourceId: string;
  title: string;
  variant?: "link" | "button";
};

export function DeleteResourceButton({
  kind,
  resourceId,
  title,
  variant = "link",
}: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const cfg = LABELS[kind];

  const remove = async () => {
    if (
      !window.confirm(
        `Supprimer « ${title} » ?\n\n${cfg.noun} ne sera plus visible sur la plateforme. Cette action est irréversible.`
      )
    ) {
      return;
    }

    setLoading(true);
    const res = await fetch(cfg.apiPath(resourceId), { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toastError(
        typeof json.error === "string"
          ? json.error
          : "Suppression impossible"
      );
      return;
    }

    success(kind === "listing" ? "Annonce supprimée" : "Service supprimé");
    router.push(cfg.redirect);
    router.refresh();
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => void remove()}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {loading ? "Suppression…" : "Supprimer"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void remove()}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "Suppression…" : "Supprimer"}
    </button>
  );
}

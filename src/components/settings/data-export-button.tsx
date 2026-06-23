"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DataExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me/export");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          typeof json.error === "string"
            ? json.error
            : "Export impossible. Réessayez plus tard."
        );
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `louetonmatos-export-${Date.now()}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export impossible. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-anthracite-500">
        Téléchargez une copie de vos données personnelles (profil, réservations,
        messages envoyés, avis, etc.) au format JSON, conformément au RGPD.
      </p>
      <Button
        type="button"
        variant="outline"
        loading={loading}
        onClick={() => void exportData()}
      >
        <Download className="mr-2 h-4 w-4" />
        Télécharger mes données
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

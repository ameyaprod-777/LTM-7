"use client";

import Image from "next/image";
import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";

type Props = {
  coverUrl: string;
  onChange: (url: string) => void;
};

export function ForumCoverUpload({ coverUrl, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/forum/cover", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Échec de l'upload");
      return;
    }

    onChange(json.url as string);
  };

  return (
    <div className="space-y-2">
      <Label>Image de couverture</Label>
      {coverUrl ? (
        <div className="relative aspect-video max-w-md overflow-hidden rounded-xl border border-anthracite-100">
          <Image src={coverUrl} alt="" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex aspect-video max-w-md cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-anthracite-200 text-anthracite-400 hover:border-accent hover:text-accent">
          <Upload className="h-6 w-6" />
          <span className="mt-2 text-xs">
            {uploading ? "Envoi…" : "JPG, PNG ou WebP (max. 8 Mo)"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

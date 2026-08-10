"use client";

import Image from "next/image";
import { useState } from "react";
import { Upload, X } from "lucide-react";
type Props = {
  listingId?: string;
  photos: string[];
  onChange: (urls: string[]) => void;
};

export function ListingPhotoUpload({ listingId, photos, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (photos.length >= 10) {
      setError("Maximum 10 photos.");
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      listingId
        ? `/api/listings/${listingId}/photos`
        : "/api/listings/photos/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const json = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Échec de l'upload");
      return;
    }

    onChange([...photos, json.url as string]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((url, i) => (
          <div
            key={url}
            className="relative h-24 w-24 overflow-hidden rounded-lg border border-anthracite-100 bg-anthracite-50"
          >
            <Image src={url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-anthracite-200 text-anthracite-400 hover:border-accent hover:text-accent">
          <Upload className="h-5 w-5" />
          <span className="mt-1 text-[10px]">Ajouter</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*,.heic,.heif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {uploading && (
        <p className="text-xs text-anthracite-500">Envoi en cours…</p>
      )}
      {!listingId && (
        <p className="text-xs text-anthracite-500">
          Les photos seront attachées à l&apos;annonce lors de la publication. Vous
          pouvez aussi coller une URL ci-dessous.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}


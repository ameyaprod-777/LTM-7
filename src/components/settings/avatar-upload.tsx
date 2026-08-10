"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

/** Recompresse en JPEG pour fiabiliser l’upload mobile (HEIC / gros fichiers / type vide). */
async function prepareAvatarForUpload(file: File): Promise<File> {
  const type = (file.type || "").toLowerCase();
  if (type === "image/heic" || type === "image/heif") {
    throw new Error(
      "Format HEIC non supporté. Sur iPhone : Réglages → Appareil photo → Formats → « Le plus compatible »."
    );
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    return new File([blob], "avatar.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    // Navigateur incapable de décoder (ex. HEIC) — on envoie le fichier tel quel
    return file;
  }
}

export function AvatarUpload({
  currentImage,
  onUploaded,
  inputId = "avatar-upload",
}: {
  currentImage: string | null;
  onUploaded: (url: string) => void;
  inputId?: string;
}) {
  const [preview, setPreview] = useState(currentImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const prepared = await prepareAvatarForUpload(file);
      const formData = new FormData();
      formData.set("avatar", prepared);

      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Erreur upload");
        return;
      }

      setPreview(json.image);
      onUploaded(json.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Photo de profil</Label>
      <div className="flex items-center gap-4">
        {preview ? (
          <Image
            src={preview}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-anthracite-100 text-sm text-anthracite-400">
            ?
          </div>
        )}
        <div>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void upload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={loading}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            Choisir une image
          </Button>
          <p className="mt-1 text-xs text-anthracite-400">
            JPG, PNG ou WebP — max. 5 Mo (recommandé depuis le téléphone)
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

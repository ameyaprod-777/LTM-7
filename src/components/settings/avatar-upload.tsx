"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
    const formData = new FormData();
    formData.set("avatar", file);

    const res = await fetch("/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur upload");
      return;
    }

    setPreview(json.image);
    onUploaded(json.image);
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
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
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
            JPG, PNG ou WebP — max. 3 Mo
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

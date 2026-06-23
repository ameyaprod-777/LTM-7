"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ForumPostType } from "@prisma/client";
import {
  FORUM_POST_TYPE_LABELS,
  FORUM_POST_TYPE_DESCRIPTIONS,
} from "@/lib/forum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TYPES = [
  ForumPostType.ACTU,
  ForumPostType.PROJECT,
  ForumPostType.NEED,
] as const;

export function QuickPostForm() {
  const router = useRouter();
  const [postType, setPostType] = useState<ForumPostType>(ForumPostType.ACTU);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postType,
        title,
        body,
        city: city || undefined,
        eventAt: eventAt ? new Date(eventAt).toISOString() : undefined,
        projectUrl: projectUrl || undefined,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof json.error === "string"
          ? json.error
          : "Vérifiez les champs du formulaire."
      );
      return;
    }

    router.push(`/forum/${json.id}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-anthracite-100 bg-white p-5 shadow-sm"
    >
      <p className="font-semibold text-anthracite">Publier sur le fil</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPostType(type)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              postType === type
                ? "bg-accent text-white"
                : "bg-anthracite-100 text-anthracite-600 hover:bg-anthracite-200"
            }`}
          >
            {FORUM_POST_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-anthracite-500">
        {FORUM_POST_TYPE_DESCRIPTIONS[postType]}
      </p>

      <div className="mt-4 space-y-3">
        <Input
          placeholder={
            postType === ForumPostType.NEED
              ? "Ex. Besoin d'une FX3 dimanche 17 mai à 20h"
              : postType === ForumPostType.PROJECT
                ? "Titre de votre projet"
                : "Titre de votre publication"
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {postType === ForumPostType.NEED && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="datetime-local"
              value={eventAt}
              onChange={(e) => setEventAt(e.target.value)}
              required
            />
            <Input
              placeholder="Ville (ex. Paris)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        )}

        {postType === ForumPostType.PROJECT && (
          <Input
            placeholder="Lien portfolio / Vimeo (optionnel)"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />
        )}

        <Textarea
          rows={postType === ForumPostType.ACTU ? 3 : 4}
          placeholder={
            postType === ForumPostType.NEED
              ? "Précisions : durée, accessoires, budget, contact…"
              : postType === ForumPostType.PROJECT
                ? "Décrivez le projet, votre rôle, la date de diffusion…"
                : "Votre message…"
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <Button type="submit" className="mt-4 w-full sm:w-auto" loading={loading}>
        Publier
      </Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ForumPostType, ForumSection } from "@prisma/client";
import {
  FORUM_POST_TYPE_LABELS,
  FORUM_POST_TYPE_DESCRIPTIONS,
  FORUM_SECTION_LABELS,
  postTypeToSection,
} from "@/lib/forum";
import { ForumCoverUpload } from "@/components/forum/forum-cover-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/providers/toast-provider";

export function NewPostForm({
  defaultType,
}: {
  defaultType?: ForumPostType;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [postType, setPostType] = useState(defaultType ?? ForumPostType.ACTU);
  const [section, setSection] = useState<ForumSection>(
    postTypeToSection(defaultType ?? ForumPostType.ACTU)
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postType,
        section,
        title,
        body,
        city: city || undefined,
        eventAt: eventAt ? new Date(eventAt).toISOString() : undefined,
        projectUrl: projectUrl || undefined,
        coverImage: coverImage || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setLoading(false);
    if (res.ok) {
      const post = await res.json();
      success("Publication créée");
      router.push(`/forum/${post.id}`);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    toastError(data.error ?? "Publication impossible");
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <div>
        <Label>Type de publication</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.values(ForumPostType).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPostType(type);
                setSection(postTypeToSection(type));
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                postType === type
                  ? "bg-accent text-white"
                  : "border border-anthracite-200 text-anthracite-600"
              }`}
            >
              {FORUM_POST_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-anthracite-500">
          {FORUM_POST_TYPE_DESCRIPTIONS[postType]}
        </p>
      </div>

      <div>
        <Label>Section</Label>
        <select
          className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
          value={section}
          onChange={(e) => setSection(e.target.value as ForumSection)}
        >
          {Object.entries(FORUM_SECTION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Titre *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            postType === ForumPostType.NEED
              ? "Besoin d'une FX3 — dimanche 17 mai 20h"
              : undefined
          }
          required
        />
      </div>

      {postType === ForumPostType.NEED && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Date et heure du besoin *</Label>
            <Input
              type="datetime-local"
              value={eventAt}
              onChange={(e) => setEventAt(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Ville</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Paris, Lyon…"
            />
          </div>
        </div>
      )}

      {postType === ForumPostType.PROJECT && (
        <div className="space-y-4">
          <div>
            <Label>Lien du projet</Label>
            <Input
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://vimeo.com/…"
            />
          </div>
          <ForumCoverUpload coverUrl={coverImage} onChange={setCoverImage} />
        </div>
      )}

      <div>
        <Label>Contenu *</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} required />
      </div>

      <div>
        <Label>Tags (optionnel)</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="docu, paris, fx3"
        />
      </div>

      <Button type="submit" loading={loading}>
        Publier sur le fil
      </Button>
    </form>
  );
}

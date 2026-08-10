"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoEmbed } from "@/components/media/video-embed";
import {
  MAX_PROFILE_PROJECTS,
  VIDEO_URL_ERROR,
  parseVideoUrl,
} from "@/lib/video-embed";

export type ProfileProject = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  coverImage: string | null;
  tags: string[];
};

type FormState = {
  title: string;
  description: string;
  videoUrl: string;
  tags: string;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  videoUrl: "",
  tags: "",
});

export function ProjectForm({
  initialProjects,
}: {
  initialProjects: ProfileProject[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const canAdd = projects.length < MAX_PROFILE_PROJECTS;

  const openCreate = () => {
    if (!canAdd) return;
    setMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  };

  const openEdit = (p: ProfileProject) => {
    setMode("edit");
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description ?? "",
      videoUrl: p.videoUrl ?? "",
      tags: p.tags.join(", "),
    });
    setError(null);
  };

  const cancel = () => {
    setMode("idle");
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  };

  const validate = (): string | null => {
    if (form.title.trim().length < 2) return "Titre requis (2 caractères min.).";
    if (!parseVideoUrl(form.videoUrl)) return VIDEO_URL_ERROR;
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      videoUrl: form.videoUrl.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ...(mode === "edit" && editingId ? { id: editingId } : {}),
    };

    const res = await fetch("/api/projects", {
      method: mode === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof json.error === "string" ? json.error : "Enregistrement impossible."
      );
      return;
    }

    if (mode === "edit" && editingId) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingId ? (json as ProfileProject) : p))
      );
    } else {
      setProjects((prev) => [...prev, json as ProfileProject]);
    }

    cancel();
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce projet ?")) return;
    setLoading(true);
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      setError("Suppression impossible.");
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) cancel();
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-anthracite-500">
        Jusqu&apos;à {MAX_PROFILE_PROJECTS} projets — liens{" "}
        <strong className="font-medium text-anthracite">YouTube</strong> ou{" "}
        <strong className="font-medium text-anthracite">Vimeo</strong> uniquement.
        ({projects.length}/{MAX_PROFILE_PROJECTS})
      </p>

      <ul className="space-y-4">
        {projects.map((p) => (
          <li
            key={p.id}
            className="overflow-hidden rounded-xl border border-anthracite-100"
          >
            {p.videoUrl ? (
              <VideoEmbed url={p.videoUrl} title={p.title} />
            ) : (
              <div className="bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Aucun lien vidéo valide — modifiez ce projet pour ajouter YouTube
                ou Vimeo.
              </div>
            )}
            <div className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-anthracite">{p.title}</p>
                {p.description && (
                  <p className="mt-1 text-sm text-anthracite-500">
                    {p.description}
                  </p>
                )}
                {p.tags.length > 0 && (
                  <p className="mt-1 text-xs text-anthracite-400">
                    {p.tags.join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(p)}
                  disabled={loading}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void remove(p.id)}
                  disabled={loading}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {projects.length === 0 && mode === "idle" && (
        <p className="rounded-lg border border-dashed border-anthracite-200 px-4 py-6 text-center text-sm text-anthracite-400">
          Aucun projet pour l&apos;instant. Ajoutez jusqu&apos;à{" "}
          {MAX_PROFILE_PROJECTS} vidéos YouTube ou Vimeo.
        </p>
      )}

      {mode === "idle" && canAdd && (
        <Button type="button" variant="outline" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un projet
        </Button>
      )}

      {mode !== "idle" && (
        <form
          onSubmit={(e) => void submit(e)}
          className="space-y-4 rounded-xl border border-anthracite-100 bg-anthracite-50/50 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-anthracite">
              {mode === "edit" ? "Modifier le projet" : "Nouveau projet"}
            </h3>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg p-2 text-anthracite-400 hover:bg-white hover:text-anthracite"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <Label htmlFor="project-title">Titre</Label>
            <Input
              id="project-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={120}
            />
          </div>

          <div>
            <Label htmlFor="project-video">Lien YouTube ou Vimeo</Label>
            <Input
              id="project-video"
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=… ou https://vimeo.com/…"
              required
            />
            <p className="mt-1 text-xs text-anthracite-400">
              Coller l&apos;URL complète de la vidéo (pas un lien de chaîne).
            </p>
          </div>

          {parseVideoUrl(form.videoUrl) && (
            <VideoEmbed url={form.videoUrl} title="Aperçu" />
          )}

          <div>
            <Label htmlFor="project-desc">Description (optionnel)</Label>
            <Input
              id="project-desc"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              maxLength={2000}
            />
          </div>

          <div>
            <Label htmlFor="project-tags">Tags (optionnel, virgules)</Label>
            <Input
              id="project-tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Court métrage, 2024, DOP"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={loading}>
              {mode === "edit" ? "Enregistrer" : "Ajouter"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={cancel}
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

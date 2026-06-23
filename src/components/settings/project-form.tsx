"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        coverImage,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setTitle("");
    setDescription("");
    setCoverImage("");
    setTags("");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Titre</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label>Image (URL)</Label>
        <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Tags (séparés par des virgules)</Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Court métrage, 2024, DOP" />
      </div>
      <Button type="submit" loading={loading}>
        Ajouter le projet
      </Button>
    </form>
  );
}

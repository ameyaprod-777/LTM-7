"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  postId: string;
  authorId: string;
  currentUserId: string;
  canEdit: boolean;
  initialTitle: string;
  initialBody: string;
};

export function ThreadPostActions({
  postId,
  authorId,
  currentUserId,
  canEdit,
  initialTitle,
  initialBody,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);

  if (authorId !== currentUserId || !canEdit) return null;

  const save = async () => {
    setLoading(true);
    await fetch(`/api/forum/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  const remove = async () => {
    if (!window.confirm("Supprimer cette publication ?")) return;
    const res = await fetch(`/api/forum/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/forum");
      router.refresh();
    }
  };

  if (editing) {
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-anthracite-100 p-4">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        <div className="flex gap-2">
          <Button size="sm" loading={loading} onClick={save}>
            Enregistrer
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Modifier
      </Button>
      <Button size="sm" variant="outline" onClick={remove}>
        <Trash2 className="mr-2 h-4 w-4" />
        Supprimer
      </Button>
      <p className="w-full text-xs text-anthracite-400">
        Modification possible pendant 15 minutes après publication.
      </p>
    </div>
  );
}

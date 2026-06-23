"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, Pencil, Trash2 } from "lucide-react";
import { canEditForumContent } from "@/lib/forum-query";

type Reply = {
  id: string;
  body: string;
  createdAt: Date | string;
  editedAt?: Date | string | null;
  author: { id: string; name: string | null; image: string | null };
};

export function ThreadView({
  postId,
  locked,
  replies: initialReplies,
  reactionCount,
  currentUserId,
}: {
  postId: string;
  locked: boolean;
  replies: Reply[];
  reactionCount: number;
  currentUserId: string;
}) {
  const router = useRouter();
  const [replies, setReplies] = useState(initialReplies);
  const [body, setBody] = useState("");
  const [reactions, setReactions] = useState(reactionCount);
  const [loading, setLoading] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const reply = async () => {
    setLoading(true);
    const res = await fetch(`/api/forum/posts/${postId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const r = await res.json();
      setReplies([...replies, r]);
      setBody("");
    }
    setLoading(false);
  };

  const react = async () => {
    const res = await fetch(`/api/forum/posts/${postId}/react`, { method: "POST" });
    const json = await res.json();
    setReactions((c) => c + (json.reacted ? 1 : -1));
  };

  const saveReply = async (replyId: string) => {
    const res = await fetch(`/api/forum/posts/${postId}/replies/${replyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editBody }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReplies(replies.map((r) => (r.id === replyId ? { ...r, ...updated } : r)));
      setEditingReplyId(null);
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!window.confirm("Supprimer cette réponse ?")) return;
    const res = await fetch(`/api/forum/posts/${postId}/replies/${replyId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReplies(replies.filter((r) => r.id !== replyId));
      router.refresh();
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={react}
        className="flex items-center gap-1 text-sm text-anthracite-500 hover:text-accent"
      >
        <ThumbsUp className="h-4 w-4" /> {reactions}
      </button>

      <h2 className="mt-8 text-lg font-semibold">
        {replies.length} réponse{replies.length !== 1 ? "s" : ""}
      </h2>
      <ul className="mt-4 space-y-4">
        {replies.map((r) => {
          const mine = r.author.id === currentUserId;
          const canEdit = mine && canEditForumContent(new Date(r.createdAt));
          return (
            <li key={r.id} className="rounded-lg border border-anthracite-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-anthracite">{r.author.name}</p>
                {canEdit && editingReplyId !== r.id && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReplyId(r.id);
                        setEditBody(r.body);
                      }}
                      className="text-anthracite-400 hover:text-accent"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteReply(r.id)}
                      className="text-anthracite-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {editingReplyId === r.id ? (
                <div className="mt-2">
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => void saveReply(r.id)}>
                      Enregistrer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingReplyId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm text-anthracite-600">
                  {r.body}
                  {r.editedAt && (
                    <span className="ml-2 text-xs text-anthracite-400">(modifié)</span>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {!locked && (
        <div className="mt-6">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Votre réponse…"
          />
          <Button className="mt-2" onClick={reply} loading={loading}>
            Répondre
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pin, Lock, Trash2, Flag, EyeOff } from "lucide-react";
import { FORUM_POST_TYPE_LABELS, FORUM_SECTION_LABELS } from "@/lib/forum";
import { formatDate } from "@/lib/utils";
import type { ForumPostType, ForumSection } from "@prisma/client";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  title: string;
  postType: ForumPostType;
  section: ForumSection;
  pinned: boolean;
  locked: boolean;
  flagged: boolean;
  authorHidden: boolean;
  createdAt: string;
  author: { name: string | null; email: string };
  _count: { replies: number; reports: number };
};

export function AdminForumTable({ posts }: { posts: Row[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const patch = async (id: string, data: Record<string, boolean | undefined>) => {
    setLoadingId(id);
    await fetch(`/api/forum/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoadingId(null);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette publication ?")) return;
    setLoadingId(id);
    await fetch(`/api/forum/posts/${id}`, { method: "DELETE" });
    setLoadingId(null);
    router.refresh();
  };

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-anthracite-50 text-anthracite-500">
          <tr>
            <th className="px-4 py-3">Publication</th>
            <th className="px-4 py-3">Auteur</th>
            <th className="px-4 py-3">Type / Section</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr
              key={p.id}
              className={`border-t border-anthracite-50 ${p.flagged ? "bg-red-50/50" : ""}`}
            >
              <td className="px-4 py-3">
                <Link href={`/forum/${p.id}`} className="font-medium hover:text-accent">
                  {p.title}
                </Link>
                <p className="text-xs text-anthracite-400">
                  {formatDate(p.createdAt)} · {p._count.replies} réponses
                </p>
              </td>
              <td className="px-4 py-3 text-anthracite-600">
                {p.author.name ?? p.author.email}
                {p.authorHidden && (
                  <span className="ml-1 text-xs text-amber-700">(masqué public)</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-anthracite-500">
                {FORUM_POST_TYPE_LABELS[p.postType]}
                <br />
                {FORUM_SECTION_LABELS[p.section]}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {p.pinned && (
                    <span className="rounded bg-accent-muted px-1.5 py-0.5 text-xs text-accent">
                      Épinglé
                    </span>
                  )}
                  {p.locked && (
                    <span className="rounded bg-anthracite-100 px-1.5 py-0.5 text-xs">
                      Verrouillé
                    </span>
                  )}
                  {p.authorHidden && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      Auteur masqué
                    </span>
                  )}
                  {p.flagged && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">
                      <Flag className="h-3 w-3" />
                      {p._count.reports} signalement{p._count.reports > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === p.id}
                    onClick={() => void patch(p.id, { pinned: !p.pinned })}
                    title="Épingler"
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === p.id}
                    onClick={() => void patch(p.id, { locked: !p.locked })}
                    title="Verrouiller"
                  >
                    <Lock className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === p.id}
                    onClick={() => void patch(p.id, { authorHidden: !p.authorHidden })}
                    title="Masquer l'auteur"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === p.id}
                    onClick={() => void remove(p.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && (
        <p className="py-12 text-center text-anthracite-400">Aucune publication.</p>
      )}
    </div>
  );
}

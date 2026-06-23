"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConversationItem = {
  id: string;
  otherName: string | null;
  contextLabel: string | null;
  preview: string | null;
  unread: number;
};

type Props = {
  conversations: ConversationItem[];
  totalUnread: number;
};

export function ConversationList({ conversations, totalUnread }: Props) {
  const router = useRouter();
  const [loadingAll, setLoadingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const markAllRead = async () => {
    setLoadingAll(true);
    await fetch("/api/messages/unread", { method: "PATCH" });
    setLoadingAll(false);
    window.dispatchEvent(new CustomEvent("ltm-messages-read"));
    router.refresh();
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        "Supprimer cette conversation de votre liste ? L'autre membre la conservera."
      )
    ) {
      return;
    }
    setDeletingId(id);
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={loadingAll}
          disabled={totalUnread === 0 && !loadingAll}
          onClick={() => void markAllRead()}
          title={
            totalUnread === 0
              ? "Aucun message non lu"
              : "Marquer toutes les conversations comme lues"
          }
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Tout lire
          {totalUnread > 0 && (
            <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[10px] text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </Button>
      </div>

      <ul className="mt-4 space-y-2">
        {conversations.map((c) => (
          <li key={c.id} className="group relative">
            <Link
              href={`/dashboard/messages/${c.id}`}
              className="flex items-center gap-3 rounded-xl border border-anthracite-100 p-4 pr-12 hover:bg-anthracite-50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-anthracite">
                  {c.otherName ?? "Conversation"}
                  {c.contextLabel && (
                    <span className="font-normal text-anthracite-500">
                      {" "}
                      · {c.contextLabel}
                    </span>
                  )}
                </p>
                {c.preview && (
                  <p className="mt-1 truncate text-sm text-anthracite-400">
                    {c.preview}
                  </p>
                )}
              </div>
              {c.unread > 0 && (
                <span className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-accent px-2 text-xs font-bold text-white">
                  {c.unread > 99 ? "99+" : c.unread}
                </span>
              )}
            </Link>
            <button
              type="button"
              title="Supprimer de ma liste"
              disabled={deletingId === c.id}
              onClick={(e) => void deleteConversation(c.id, e)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-anthracite-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

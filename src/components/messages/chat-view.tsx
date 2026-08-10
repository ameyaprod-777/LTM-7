"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import { Paperclip, Flag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MESSAGE_REPLY_TEMPLATES } from "@/lib/message-templates";
import { formatDate } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  deletedAt?: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMime: string | null;
  sender: { id: string; name: string | null };
};

type Props = {
  conversationId: string;
  currentUserId: string;
  pusherKey?: string | null;
  pusherCluster?: string | null;
};

export function ChatView({
  conversationId,
  currentUserId,
  pusherKey,
  pusherCluster = "eu",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string;
    name: string;
    mime: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages/${conversationId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as Message[];
      setMessages(data);
      window.dispatchEvent(new CustomEvent("ltm-messages-read"));
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling toujours actif : fonctionne en prod sans Pusher, et sert de
  // filet si Pusher est mal configuré ou l’auth canal échoue.
  useEffect(() => {
    const intervalMs = pusherKey ? 8000 : 3000;
    const id = setInterval(() => void load(), intervalMs);
    return () => clearInterval(id);
  }, [load, pusherKey]);

  useEffect(() => {
    if (!pusherKey) return;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster ?? "eu",
      authEndpoint: "/api/pusher/auth",
    });

    const channel = pusher.subscribe(`private-conversation-${conversationId}`);
    channel.bind("new-message", () => {
      void load();
    });
    channel.bind("message-deleted", (payload: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? {
                ...m,
                body: "[Message supprimé]",
                deletedAt: new Date().toISOString(),
                attachmentUrl: null,
                attachmentName: null,
                attachmentMime: null,
              }
            : m
        )
      );
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-conversation-${conversationId}`);
      pusher.disconnect();
    };
  }, [pusherKey, pusherCluster, conversationId, load]);

  const send = async () => {
    if (!body.trim() && !pendingAttachment) return;
    setLoading(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          body,
          attachmentUrl: pendingAttachment?.url,
          attachmentName: pendingAttachment?.name,
          attachmentMime: pendingAttachment?.mime,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setSendError(
          typeof json.error === "string"
            ? json.error
            : "Impossible d’envoyer le message."
        );
        return;
      }
      setBody("");
      setPendingAttachment(null);
      void load();
    } catch {
      setSendError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setSendError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/messages/${conversationId}/upload`, {
        method: "POST",
        body: formData,
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        name?: string;
        mime?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        setSendError(
          typeof json.error === "string"
            ? json.error
            : "Échec de l’envoi de la pièce jointe."
        );
        return;
      }
      setPendingAttachment({
        url: json.url,
        name: json.name ?? file.name,
        mime: json.mime ?? file.type,
      });
    } catch {
      setSendError("Erreur réseau lors de l’upload.");
    } finally {
      setUploading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    const res = await fetch(`/api/messages/item/${messageId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                body: "[Message supprimé]",
                deletedAt: new Date().toISOString(),
                attachmentUrl: null,
                attachmentName: null,
                attachmentMime: null,
              }
            : m
        )
      );
    }
  };

  const reportMessage = async (messageId: string) => {
    const reason = window.prompt("Motif du signalement (min. 10 caractères)");
    if (!reason || reason.length < 10) return;
    await fetch(`/api/messages/report/${messageId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
  };

  return (
    <div className="flex h-[min(560px,70dvh)] min-h-[320px] flex-col rounded-xl border border-anthracite-100">
      <div className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-anthracite-50 p-2 scrollbar-none">
        {MESSAGE_REPLY_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setBody(t.body)}
            className="shrink-0 rounded-full bg-anthracite-50 px-2.5 py-1.5 text-xs text-anthracite-600 hover:bg-accent-muted hover:text-accent"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          const deleted = !!m.deletedAt || m.body === "[Message supprimé]";
          return (
            <div
              key={m.id}
              className={`group max-w-[min(85%,24rem)] ${mine ? "ml-auto" : ""}`}
            >
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  deleted
                    ? "bg-anthracite-50 italic text-anthracite-400"
                    : mine
                      ? "bg-accent text-white"
                      : "bg-anthracite-100 text-anthracite"
                }`}
              >
                <p className="text-xs opacity-70">{m.sender.name}</p>
                {m.body && (
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                )}
                {m.attachmentUrl && (
                  <div className="mt-2">
                    {m.attachmentMime?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.attachmentUrl}
                        alt={m.attachmentName ?? ""}
                        className="max-h-48 max-w-full rounded-lg object-contain"
                      />
                    ) : (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline ${mine ? "text-white" : "text-accent"}`}
                      >
                        {m.attachmentName ?? "Pièce jointe PDF"}
                      </a>
                    )}
                  </div>
                )}
                <p className="mt-1 text-[10px] opacity-60">
                  {formatDate(m.createdAt)}
                  {mine && m.readAt && " · Lu"}
                </p>
              </div>
              <div className="mt-1 flex gap-3 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                {mine && !deleted && (
                  <button
                    type="button"
                    onClick={() => void deleteMessage(m.id)}
                    className="flex min-h-8 items-center gap-1 text-[11px] text-anthracite-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                )}
                {!mine && !deleted && (
                  <button
                    type="button"
                    onClick={() => void reportMessage(m.id)}
                    className="flex min-h-8 items-center gap-1 text-[11px] text-anthracite-400"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Signaler
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {pendingAttachment && (
        <p className="border-t px-3 py-2 text-xs text-anthracite-500">
          Pièce jointe : {pendingAttachment.name}
          <button
            type="button"
            className="ml-2 text-red-500"
            onClick={() => setPendingAttachment(null)}
          >
            Retirer
          </button>
        </p>
      )}

      {sendError && (
        <p className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {sendError}
        </p>
      )}

      <div className="flex items-end gap-2 border-t p-2 sm:p-3 safe-pb">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-anthracite-200 hover:bg-anthracite-50">
          <Paperclip className="h-4 w-4 text-anthracite-500" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
              e.target.value = "";
            }}
          />
        </label>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm"
          placeholder="Votre message…"
        />
        <Button
          onClick={send}
          loading={loading || uploading}
          className="shrink-0"
          size="sm"
        >
          Envoyer
        </Button>
      </div>
    </div>
  );
}

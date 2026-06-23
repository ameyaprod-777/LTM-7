"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type Props = {
  ticketId: string;
  isStaff?: boolean;
  status?: string;
  category?: string;
  priority?: string;
  assignedToId?: string | null;
  agents?: { id: string; name: string | null }[];
  onStatusChange?: (status: string) => void;
  onCategoryChange?: (category: string) => void;
  onPriorityChange?: (priority: string) => void;
  onAssignChange?: (id: string | null) => void;
};

export function TicketReplyForm({
  ticketId,
  isStaff = false,
  status,
  category,
  priority,
  assignedToId,
  agents = [],
  onStatusChange,
  onCategoryChange,
  onPriorityChange,
  onAssignChange,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!body.trim() && !file) return;
    setLoading(true);

    let attachment:
      | { url: string; name: string; mime: string }
      | undefined;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const up = await fetch(`/api/support/${ticketId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (up.ok) {
        attachment = await up.json();
      }
    }

    const payload: Record<string, unknown> = {
      ...(isStaff && status ? { status } : {}),
      ...(isStaff && category ? { category } : {}),
      ...(isStaff && priority ? { priority } : {}),
      ...(isStaff ? { assignedToId: assignedToId || null } : {}),
    };

    if (body.trim() || attachment) {
      payload.body = body.trim() || `Pièce jointe : ${attachment!.name}`;
      if (attachment) {
        payload.attachmentUrl = attachment.url;
        payload.attachmentName = attachment.name;
        payload.attachmentMime = attachment.mime;
      }
    }

    await fetch(`/api/support/${ticketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setBody("");
    setFile(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-3 border-t border-anthracite-100 pt-4">
      {isStaff && (
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={status}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm"
          >
            <option value="OPEN">Ouvert</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="RESOLVED">Résolu</option>
            <option value="CLOSED">Fermé</option>
          </select>
          <select
            value={category}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm"
          >
            <option value="TECHNICAL">Technique</option>
            <option value="BOOKING_DISPUTE">Litige location</option>
            <option value="ACCOUNT">Compte</option>
            <option value="BILLING">Paiement</option>
            <option value="OTHER">Autre</option>
          </select>
          <select
            value={priority}
            onChange={(e) => onPriorityChange?.(e.target.value)}
            className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm"
          >
            <option value="LOW">Priorité basse</option>
            <option value="NORMAL">Normale</option>
            <option value="HIGH">Haute</option>
            <option value="URGENT">Urgente</option>
          </select>
          <select
            value={assignedToId ?? ""}
            onChange={(e) => onAssignChange?.(e.target.value || null)}
            className="rounded-lg border border-anthracite-200 px-2 py-1.5 text-sm"
          >
            <option value="">Non assigné</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.id}
              </option>
            ))}
          </select>
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        rows={3}
        placeholder={isStaff ? "Réponse staff…" : "Votre message…"}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-anthracite-200 px-3 py-2 text-xs text-anthracite-500 hover:border-accent">
          <Upload className="h-4 w-4" />
          {file ? file.name : "Capture / PDF (max. 10 Mo)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <Button onClick={send} loading={loading} disabled={!body.trim() && !file}>
          {isStaff ? "Envoyer (staff)" : "Répondre"}
        </Button>
      </div>
    </div>
  );
}

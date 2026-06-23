"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactMemberButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/conversations/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: message.trim() || undefined }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur");
      return;
    }
    router.push(`/dashboard/messages/${json.conversationId}`);
    router.refresh();
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Envoyer un message
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-anthracite-100 p-4">
      <Label htmlFor="direct-msg">Message à {userName}</Label>
      <Textarea
        id="direct-msg"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Bonjour…"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button loading={loading} onClick={start}>
          Envoyer
        </Button>
      </div>
    </div>
  );
}

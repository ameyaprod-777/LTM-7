"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  serviceId: string;
  serviceTitle: string;
};

export function ContactServiceButton({ serviceId, serviceTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConversation = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        message: message.trim() || undefined,
      }),
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
      <Button className="w-full" onClick={() => setOpen(true)}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Contacter
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="contact-message">Votre message</Label>
        <Textarea
          id="contact-message"
          rows={4}
          className="mt-2"
          placeholder={`Bonjour, je suis intéressé·e par « ${serviceTitle} »…`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setOpen(false)}
        >
          Annuler
        </Button>
        <Button
          type="button"
          className="flex-1"
          loading={loading}
          onClick={startConversation}
        >
          Envoyer
        </Button>
      </div>
    </div>
  );
}

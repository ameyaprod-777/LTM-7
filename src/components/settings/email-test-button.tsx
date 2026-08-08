"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailTestButton({
  configured,
  fromEmail = "support@louetonmatos.fr",
}: {
  configured: boolean;
  fromEmail?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTest = async () => {
    setLoading(true);
    setFeedback(null);
    setError(null);

    const res = await fetch("/api/email/test", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Envoi impossible");
      return;
    }

    setFeedback(
      typeof json.message === "string"
        ? json.message
        : "Email de test envoyé."
    );
  };

  return (
    <div className="rounded-xl border border-anthracite-100 bg-white p-5">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-anthracite">Notifications par email</h3>
          <p className="mt-1 text-sm text-anthracite-500">
            {configured
              ? `Envoi depuis ${fromEmail}. Cliquez ci-dessous pour recevoir un email de test sur votre adresse de compte.`
              : "Ajoutez RESEND_API_KEY dans .env.production (ou .env en local), puis redémarrez l’app (pm2 restart louetonmatos ou npm run dev)."}
          </p>
          {feedback && (
            <p className="mt-2 text-sm text-green-700">{feedback}</p>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button
            type="button"
            size="sm"
            className="mt-3"
            disabled={!configured}
            loading={loading}
            onClick={() => void sendTest()}
          >
            Envoyer un email de test
          </Button>
        </div>
      </div>
    </div>
  );
}

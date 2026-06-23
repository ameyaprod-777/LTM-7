"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setLoading(false);
    if (res.ok) setSent(true);
  };

  return (
    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
      <p className="text-sm font-medium text-amber-900">
        Confirmez votre adresse email
      </p>
      <p className="mt-1 text-sm text-amber-800">
        Un email de vérification a été envoyé à <strong>{email}</strong>.
        Vous devez confirmer votre email pour vous connecter avec un mot de passe.
      </p>
      {!sent ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          loading={loading}
          onClick={resend}
        >
          Renvoyer l&apos;email
        </Button>
      ) : (
        <p className="mt-2 text-sm text-green-700">Email renvoyé.</p>
      )}
    </div>
  );
}

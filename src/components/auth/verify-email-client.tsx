"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const sent = searchParams.get("sent") === "1";
  const invite = searchParams.get("invite");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    token && email ? "loading" : sent ? "idle" : "error"
  );

  useEffect(() => {
    if (!token || !email) return;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then((res) => setStatus(res.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [token, email]);

  const applyHref = invite
    ? `/apply?invite=${encodeURIComponent(invite)}`
    : "/apply";

  if (sent && status === "idle") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-anthracite-600">
          Un email de confirmation vient d&apos;être envoyé à votre adresse.
          Cliquez sur le lien dans le message pour activer votre compte, puis
          poursuivez votre candidature.
        </p>
        <p className="text-xs text-anthracite-400">
          Pensez à vérifier vos spams. Vous pouvez renvoyer l&apos;email depuis
          les paramètres une fois connecté.
        </p>
        <Link
          href={applyHref}
          className="inline-flex rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Continuer vers la candidature
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return <p className="text-sm text-anthracite-600">Vérification en cours…</p>;
  }

  if (status === "ok") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-green-700">
          Votre adresse email est confirmée.
        </p>
        <Link
          href={applyHref}
          className="inline-flex rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Continuer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-red-600">
        Lien invalide ou expiré. Connectez-vous pour renvoyer un email de
        vérification.
      </p>
      <Link
        href="/login"
        className="inline-flex rounded-lg border border-anthracite-200 px-5 py-2.5 text-sm text-anthracite hover:border-accent"
      >
        Connexion
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type Status = "idle" | "loading" | "ok" | "error";

function verificationLockKey(email: string, token: string) {
  return `ltm-email-verify:${email}:${token}`;
}

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update, status: sessionStatus } = useSession();

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const sent = searchParams.get("sent") === "1";
  const invite = searchParams.get("invite");

  const [status, setStatus] = useState<Status>(() =>
    token && email ? "loading" : "idle"
  );
  const [countdown, setCountdown] = useState(3);
  const startedRef = useRef(false);
  const statusRef = useRef<Status>(status);
  statusRef.current = status;

  const nextStepHref = invite
    ? `/verify-identity?invite=${encodeURIComponent(invite)}`
    : "/verify-identity";
  const loginHref = invite
    ? `/login?verified=1&callbackUrl=${encodeURIComponent(nextStepHref)}`
    : `/login?verified=1&callbackUrl=${encodeURIComponent("/verify-identity")}`;

  // 1) Vérification unique (idempotente côté API + verrou navigateur)
  useEffect(() => {
    if (!token || !email || startedRef.current) return;
    startedRef.current = true;

    const lockKey = verificationLockKey(email, token);
    try {
      if (sessionStorage.getItem(lockKey) === "ok") {
        setStatus("ok");
        return;
      }
      if (sessionStorage.getItem(lockKey) === "pending") {
        // Une autre instance (Strict Mode / double mount) a déjà lancé l'appel
        return;
      }
      sessionStorage.setItem(lockKey, "pending");
    } catch {
      // sessionStorage indisponible — on continue
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        if (!res.ok) {
          // Ne pas écraser un succès déjà affiché (course entre 2 requêtes)
          if (statusRef.current === "ok") return;
          try {
            sessionStorage.removeItem(lockKey);
          } catch {
            /* ignore */
          }
          setStatus("error");
          return;
        }

        try {
          sessionStorage.setItem(lockKey, "ok");
        } catch {
          /* ignore */
        }

        try {
          await update({ user: { emailVerified: new Date().toISOString() } });
        } catch {
          // Pas de session (lien ouvert ailleurs) — redirection login ensuite
        }

        router.refresh();
        setStatus("ok");
      } catch {
        if (statusRef.current === "ok") return;
        try {
          sessionStorage.removeItem(lockKey);
        } catch {
          /* ignore */
        }
        setStatus("error");
      }
    })();
  }, [token, email, update, router]);

  // 2) Décompte + redirection (attendre que la session soit connue)
  useEffect(() => {
    if (status !== "ok") return;
    if (sessionStatus === "loading") return;

    const target = session?.user ? nextStepHref : loginHref;

    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          router.push(target);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [status, session, sessionStatus, nextStepHref, loginHref, router]);

  if (status === "idle") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-anthracite-600">
          {sent
            ? "Un email de confirmation vient d'être envoyé à votre adresse. Cliquez sur le lien dans le message pour activer votre compte."
            : "Consultez votre boîte mail pour confirmer votre adresse. Vous pouvez également vous connecter pour renvoyer un email."}
        </p>
        <p className="text-xs text-anthracite-400">
          Pensez à vérifier vos spams. Vous pouvez renvoyer l&apos;email depuis
          les paramètres une fois connecté.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg border border-anthracite-200 px-5 py-2.5 text-sm text-anthracite hover:border-accent"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-anthracite-100 bg-anthracite-50 p-5">
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-accent" />
        <div>
          <p className="text-sm font-medium text-anthracite">
            Vérification en cours…
          </p>
          <p className="mt-1 text-xs text-anthracite-500">
            Cela ne prend qu&apos;un instant.
          </p>
        </div>
      </div>
    );
  }

  if (status === "ok") {
    const target = session?.user ? nextStepHref : loginHref;
    const targetLabel = session?.user
      ? "Vérifier mon identité (étape suivante)"
      : "Me connecter pour continuer";
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div>
            <p className="text-sm font-semibold text-green-900">
              Adresse email confirmée !
            </p>
            <p className="mt-1 text-xs text-green-800">
              {sessionStatus === "loading"
                ? "Finalisation…"
                : session?.user
                  ? `Redirection automatique vers l'étape suivante dans ${countdown} s…`
                  : `Redirection vers la connexion dans ${countdown} s…`}
            </p>
          </div>
        </div>
        <Link
          href={target}
          className="inline-flex rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {targetLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Lien invalide ou expiré.</p>
          <p className="mt-1 text-xs">
            Connectez-vous pour renvoyer un email de vérification.
          </p>
        </div>
      </div>
      <Link
        href="/login"
        className="inline-flex rounded-lg border border-anthracite-200 px-5 py-2.5 text-sm text-anthracite hover:border-accent"
      >
        Connexion
      </Link>
    </div>
  );
}

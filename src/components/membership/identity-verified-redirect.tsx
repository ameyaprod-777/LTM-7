"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Rafraîchit le JWT (via useSession().update) puis redirige vers /apply.
 * Utilisé sur /verify-identity quand l'utilisateur a déjà terminé la
 * vérification Stripe Identity — on veut que la session le reflète
 * immédiatement pour que les server components (header, middleware,
 * /apply) voient `verifiedIdentity: true`.
 */
export function IdentityVerifiedRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const { update } = useSession();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    (async () => {
      try {
        // Trigger le refresh JWT (le jwt callback refetch depuis la DB
        // sur trigger === "update").
        await update({ user: { verifiedIdentity: true } });
      } catch {
        // ignore
      }
      // Force le re-render des server components (bannière onboarding, etc.)
      router.refresh();
    })();
  }, [update, router]);

  useEffect(() => {
    const target = invite
      ? `/apply?invite=${encodeURIComponent(invite)}`
      : "/apply";

    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          router.replace(target);
          router.refresh();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [router, invite]);

  return (
    <p className="mt-2 text-xs text-green-700">
      Redirection vers votre candidature dans {countdown} s…
    </p>
  );
}

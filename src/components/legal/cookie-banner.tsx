"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LEGAL_ROUTES } from "@/lib/legal-config";

const CONSENT_KEY = "ltm-cookie-consent-v1";

export type CookieConsent = "accepted" | "essential";

function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "essential") return value;
  return null;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) {
      setVisible(true);
    }
  }, []);

  const save = (value: CookieConsent) => {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-anthracite-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p
            id="cookie-banner-title"
            className="text-sm font-semibold text-anthracite"
          >
            Cookies et traceurs
          </p>
          <p
            id="cookie-banner-desc"
            className="mt-1 text-sm text-anthracite-500"
          >
            Nous utilisons des cookies strictement nécessaires au fonctionnement
            du site (connexion, sécurité). Aucun cookie publicitaire n&apos;est
            déposé sans votre accord. Consultez notre{" "}
            <Link
              href={LEGAL_ROUTES.cookies}
              className="font-medium text-accent hover:underline"
            >
              politique cookies
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => save("essential")}
          >
            Essentiels uniquement
          </Button>
          <Button type="button" size="sm" onClick={() => save("accepted")}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 font-sans antialiased">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-neutral-900">
            Une erreur est survenue
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            L&apos;incident a été enregistré. Réessayez dans un instant ou
            contactez le support si le problème persiste.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-lg bg-[#2a5f9e] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}

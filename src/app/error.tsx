"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-anthracite">
        Une erreur est survenue
      </h1>
      <p className="mt-2 text-sm text-anthracite-500">
        Nous n&apos;avons pas pu charger cette page. Réessayez dans un instant.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Réessayer
        </Button>
        <Link href="/">
          <Button variant="outline">Accueil</Button>
        </Link>
      </div>
    </div>
  );
}

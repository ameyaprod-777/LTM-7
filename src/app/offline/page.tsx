import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-anthracite-100">
        <WifiOff className="h-8 w-8 text-anthracite-400" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-anthracite">Vous êtes hors ligne</h1>
      <p className="mt-2 text-sm text-anthracite-500">
        La connexion internet est indisponible. Reconnectez-vous pour utiliser
        toutes les fonctionnalités de LoueTonMatos.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button>Retour à l&apos;accueil</Button>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-anthracite-100">
        <FileQuestion className="h-8 w-8 text-anthracite-400" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-anthracite">Page introuvable</h1>
      <p className="mt-2 text-sm text-anthracite-500">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button>Accueil</Button>
        </Link>
        <Link href="/listings">
          <Button variant="outline">Voir les annonces</Button>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LEGAL_ROUTES } from "@/lib/legal-config";

export function Footer() {
  return (
    <footer className="border-t border-anthracite-100 bg-anthracite-900 text-anthracite-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo className="[&_span]:text-white [&_span_span]:text-accent" />
            <p className="mt-3 max-w-sm text-sm text-anthracite-400">
              Louez entre créatifs, en confiance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">
                Plateforme
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/listings" className="hover:text-accent">
                    Annonces
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-accent">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/forum" className="hover:text-accent">
                    Actu
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-accent">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">
                Communauté
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/register" className="hover:text-accent">
                    Rejoindre
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-accent">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href={LEGAL_ROUTES.hub} className="hover:text-accent">
                    Tous les documents
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-anthracite-700 pt-6 text-center text-xs text-anthracite-500">
          © {new Date().getFullYear()} LoueTonMatos. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

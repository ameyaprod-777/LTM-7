import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { LEGAL_DOCUMENTS_META } from "@/content/legal";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Informations légales",
  description:
    "CGU, CGV, confidentialité, cookies, KYC et charte matériel de LoueTonMatos.",
};

export default function LegalHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-anthracite">
        Informations légales
      </h1>
      <p className="mt-2 text-anthracite-500">
        Documents régissant l&apos;utilisation de LoueTonMatos. Dernière mise à
        jour : {LEGAL_LAST_UPDATED}.
      </p>

      <ul className="mt-10 space-y-3">
        {LEGAL_DOCUMENTS_META.map((doc) => (
          <li key={doc.slug}>
            <Link
              href={doc.href}
              className="flex items-start gap-4 rounded-xl border border-anthracite-100 bg-white p-4 shadow-sm transition hover:border-accent/40 hover:shadow-md"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold text-anthracite">{doc.title}</p>
                <p className="mt-0.5 text-sm text-anthracite-500">
                  {doc.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

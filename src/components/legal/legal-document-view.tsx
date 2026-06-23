import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { LegalDocument } from "@/content/legal/types";
import { LEGAL_LAST_UPDATED, LEGAL_ROUTES } from "@/lib/legal-config";

type Props = {
  document: LegalDocument;
};

export function LegalDocumentView({ document }: Props) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={LEGAL_ROUTES.hub}
        className="mb-6 inline-flex items-center gap-1 text-sm text-anthracite-500 hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" />
        Tous les documents légaux
      </Link>

      <header className="mb-10 border-b border-anthracite-100 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-anthracite">
          {document.title}
        </h1>
        <p className="mt-2 text-anthracite-500">{document.description}</p>
        <p className="mt-4 text-xs text-anthracite-400">
          Dernière mise à jour : {LEGAL_LAST_UPDATED}
        </p>
        <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Document d&apos;information à faire valider par un conseil juridique
          avant toute exploitation commerciale à grande échelle.
        </p>
      </header>

      <nav className="mb-10 rounded-xl border border-anthracite-100 bg-anthracite-50/50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-anthracite-500">
          Sommaire
        </p>
        <ol className="space-y-1 text-sm">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-accent hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {document.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-lg font-semibold text-anthracite">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-anthracite-600"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-anthracite-600">
                  {section.bullets.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

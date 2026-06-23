import type { Metadata } from "next";
import { getCookiesDocument } from "@/content/legal";
import { getLegalPublisher } from "@/lib/legal-config";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Politique cookies",
};

export default function CookiesPage() {
  return (
    <LegalDocumentView document={getCookiesDocument(getLegalPublisher())} />
  );
}

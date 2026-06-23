import type { Metadata } from "next";
import { getPrivacyDocument } from "@/content/legal";
import { getLegalPublisher } from "@/lib/legal-config";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

export default function ConfidentialitePage() {
  return (
    <LegalDocumentView document={getPrivacyDocument(getLegalPublisher())} />
  );
}

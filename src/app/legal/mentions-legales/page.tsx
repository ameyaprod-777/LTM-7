import type { Metadata } from "next";
import { getMentionsLegalesDocument } from "@/content/legal";
import { getLegalPublisher } from "@/lib/legal-config";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Mentions légales",
};

export default function MentionsLegalesPage() {
  return (
    <LegalDocumentView
      document={getMentionsLegalesDocument(getLegalPublisher())}
    />
  );
}

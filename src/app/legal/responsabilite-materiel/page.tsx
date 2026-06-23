import type { Metadata } from "next";
import { getMaterialResponsibilityDocument } from "@/content/legal";
import { getLegalPublisher } from "@/lib/legal-config";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Charte responsabilité matériel",
};

export default function ResponsabiliteMaterielPage() {
  return (
    <LegalDocumentView
      document={getMaterialResponsibilityDocument(getLegalPublisher())}
    />
  );
}

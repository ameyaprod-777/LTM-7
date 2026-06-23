import type { Metadata } from "next";
import { getCgvDocument } from "@/content/legal";
import { getLegalPublisher } from "@/lib/legal-config";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "CGV",
};

export default function CgvPage() {
  return <LegalDocumentView document={getCgvDocument(getLegalPublisher())} />;
}

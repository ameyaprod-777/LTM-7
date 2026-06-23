import type { Metadata } from "next";
import { getCguDocument } from "@/content/legal";
import { getLegalPublisher } from "@/lib/legal-config";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "CGU",
};

export default function CguPage() {
  return <LegalDocumentView document={getCguDocument(getLegalPublisher())} />;
}

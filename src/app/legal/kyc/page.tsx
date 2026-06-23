import type { Metadata } from "next";
import { getKycDocument } from "@/content/legal";
import { getLegalPublisher } from "@/lib/legal-config";
import { LegalDocumentView } from "@/components/legal/legal-document-view";

export const metadata: Metadata = {
  title: "Politique KYC",
};

export default function KycPolicyPage() {
  return <LegalDocumentView document={getKycDocument(getLegalPublisher())} />;
}

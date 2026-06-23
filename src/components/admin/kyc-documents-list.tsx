"use client";

import { FileText, ExternalLink } from "lucide-react";
import { KYC_TYPE_LABELS } from "@/lib/validations/kyc";
import type { KycDocumentType } from "@prisma/client";

type Doc = {
  id: string;
  type: KycDocumentType;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export function KycDocumentsList({ documents }: { documents: Doc[] }) {
  if (documents.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Aucun document KYC transmis pour cette candidature.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-anthracite-400">
        Pièces d&apos;identité (KYC)
      </p>
      <ul className="mt-2 space-y-2">
        {documents.map((doc) => (
          <li key={doc.id}>
            <a
              href={`/api/admin/kyc/${doc.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-anthracite-100 bg-anthracite-50 px-3 py-2.5 text-sm transition-colors hover:border-accent hover:bg-accent-muted/30"
            >
              <FileText className="h-5 w-5 shrink-0 text-accent" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-anthracite">
                  {KYC_TYPE_LABELS[doc.type]}
                </span>
                <span className="truncate text-xs text-anthracite-500">
                  {doc.originalName} · {(doc.sizeBytes / 1024).toFixed(0)} Ko
                </span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-anthracite-400" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

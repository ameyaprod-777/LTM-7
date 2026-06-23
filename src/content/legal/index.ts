import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";
import { getCguDocument } from "@/content/legal/cgu";
import { getCgvDocument } from "@/content/legal/cgv";
import { getPrivacyDocument } from "@/content/legal/confidentialite";
import { getMentionsLegalesDocument } from "@/content/legal/mentions-legales";
import { getCookiesDocument } from "@/content/legal/cookies";
import { getKycDocument } from "@/content/legal/kyc";
import { getMaterialResponsibilityDocument } from "@/content/legal/responsabilite-materiel";
import { LEGAL_ROUTES } from "@/lib/legal-config";

export type LegalDocMeta = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export const LEGAL_DOCUMENTS_META: LegalDocMeta[] = [
  {
    slug: "cgu",
    title: "CGU",
    description: "Conditions générales d'utilisation de la plateforme",
    href: LEGAL_ROUTES.cgu,
  },
  {
    slug: "cgv",
    title: "CGV",
    description: "Location de matériel et prestations entre membres",
    href: LEGAL_ROUTES.cgv,
  },
  {
    slug: "confidentialite",
    title: "Confidentialité",
    description: "Politique de protection des données (RGPD)",
    href: LEGAL_ROUTES.privacy,
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    description: "Éditeur, hébergeur, propriété intellectuelle",
    href: LEGAL_ROUTES.mentions,
  },
  {
    slug: "cookies",
    title: "Cookies",
    description: "Traceurs et gestion de vos préférences",
    href: LEGAL_ROUTES.cookies,
  },
  {
    slug: "kyc",
    title: "Politique KYC",
    description: "Vérification d'identité à l'adhésion",
    href: LEGAL_ROUTES.kyc,
  },
  {
    slug: "responsabilite-materiel",
    title: "Responsabilité matériel",
    description: "Confiance, absence de caution, casse et médiation",
    href: LEGAL_ROUTES.material,
  },
];

export function getAllLegalDocuments(p: LegalPublisher): LegalDocument[] {
  return [
    getCguDocument(p),
    getCgvDocument(p),
    getPrivacyDocument(p),
    getMentionsLegalesDocument(p),
    getCookiesDocument(p),
    getKycDocument(p),
    getMaterialResponsibilityDocument(p),
  ];
}

export {
  getCguDocument,
  getCgvDocument,
  getPrivacyDocument,
  getMentionsLegalesDocument,
  getCookiesDocument,
  getKycDocument,
  getMaterialResponsibilityDocument,
};

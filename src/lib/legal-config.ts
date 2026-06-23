/**
 * Informations éditeur / responsable de traitement.
 * À compléter via variables d'environnement avant mise en production publique.
 */
export type LegalPublisher = {
  platformName: string;
  companyName: string;
  legalForm: string;
  address: string;
  email: string;
  siret: string;
  rcs: string;
  shareCapital: string;
  director: string;
  dpoEmail: string;
  hostName: string;
  hostAddress: string;
  websiteUrl: string;
};

export const LEGAL_LAST_UPDATED = "17 mai 2026";

export function getLegalPublisher(): LegalPublisher {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://louetonmatos.fr";

  return {
    platformName: "LoueTonMatos",
    companyName:
      process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME ?? "LoueTonMatos",
    legalForm:
      process.env.NEXT_PUBLIC_LEGAL_FORM ??
      "[forme juridique et dénomination sociale à compléter]",
    address:
      process.env.NEXT_PUBLIC_LEGAL_ADDRESS ??
      "[adresse du siège social à compléter]",
    email:
      process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? "contact@louetonmatos.fr",
    siret: process.env.NEXT_PUBLIC_LEGAL_SIRET ?? "[SIRET à compléter]",
    rcs: process.env.NEXT_PUBLIC_LEGAL_RCS ?? "",
    shareCapital:
      process.env.NEXT_PUBLIC_LEGAL_CAPITAL ?? "[capital social à compléter]",
    director:
      process.env.NEXT_PUBLIC_LEGAL_DIRECTOR ??
      "[nom du représentant légal à compléter]",
    dpoEmail:
      process.env.NEXT_PUBLIC_DPO_EMAIL ?? "dpo@louetonmatos.fr",
    hostName: process.env.NEXT_PUBLIC_HOST_NAME ?? "Vercel Inc.",
    hostAddress:
      process.env.NEXT_PUBLIC_HOST_ADDRESS ??
      "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    websiteUrl: baseUrl.replace(/\/$/, ""),
  };
}

export const LEGAL_ROUTES = {
  hub: "/legal",
  cgu: "/legal/cgu",
  cgv: "/legal/cgv",
  privacy: "/legal/confidentialite",
  mentions: "/legal/mentions-legales",
  cookies: "/legal/cookies",
  kyc: "/legal/kyc",
  material: "/legal/responsabilite-materiel",
} as const;

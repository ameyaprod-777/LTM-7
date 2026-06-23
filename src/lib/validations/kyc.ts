import { z } from "zod";
import type { KycDocumentType } from "@prisma/client";

export const kycIdentityTypeSchema = z.enum([
  "id_card",
  "passport",
  "drivers_license",
]);

export type KycIdentityType = z.infer<typeof kycIdentityTypeSchema>;

export const KYC_IDENTITY_LABELS: Record<KycIdentityType, string> = {
  id_card: "Carte nationale d'identité",
  passport: "Passeport",
  drivers_license: "Permis de conduire",
};

export const KYC_TYPE_LABELS: Record<KycDocumentType, string> = {
  ID_CARD_FRONT: "Carte d'identité — recto",
  ID_CARD_BACK: "Carte d'identité — verso",
  PASSPORT: "Passeport",
  DRIVERS_LICENSE: "Permis de conduire",
  PROOF_OF_ADDRESS: "Justificatif de domicile",
  OTHER: "Autre document",
};

export function getRequiredKycTypes(
  identityType: KycIdentityType
): ("ID_CARD_FRONT" | "ID_CARD_BACK" | "PASSPORT" | "DRIVERS_LICENSE")[] {
  switch (identityType) {
    case "id_card":
      return ["ID_CARD_FRONT", "ID_CARD_BACK"];
    case "passport":
      return ["PASSPORT"];
    case "drivers_license":
      return ["DRIVERS_LICENSE"];
  }
}

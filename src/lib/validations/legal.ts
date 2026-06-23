import { z } from "zod";

export const acceptTermsSchema = z.boolean().refine((v) => v === true, {
  message: "Vous devez accepter les conditions pour continuer.",
});

export const acceptKycPolicySchema = z.boolean().refine((v) => v === true, {
  message: "Vous devez accepter la politique KYC.",
});

export const acceptMaterialTermsSchema = z.boolean().refine((v) => v === true, {
  message:
    "Vous devez accepter la charte responsabilité matériel pour réserver.",
});

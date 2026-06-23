import { z } from "zod";
import { CreativeDomain } from "@prisma/client";
import { kycIdentityTypeSchema } from "@/lib/validations/kyc";
import {
  acceptKycPolicySchema,
  acceptTermsSchema,
} from "@/lib/validations/legal";

export const membershipApplicationSchema = z.object({
  kycIdentityType: kycIdentityTypeSchema,
  name: z.string().min(2, "Nom requis"),
  image: z.string().url().optional().or(z.literal("")),
  city: z.string().min(2, "Ville requise"),
  bio: z.string().min(20, "Bio : minimum 20 caractères").max(500),
  motivation: z
    .string()
    .min(50, "Expliquez votre motivation (min. 50 caractères)")
    .max(2000),
  creativeDomain: z.nativeEnum(CreativeDomain, {
    message: "Sélectionnez votre domaine créatif",
  }),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  invitationToken: z.string().optional(),
  acceptTerms: acceptTermsSchema,
  acceptKycPolicy: acceptKycPolicySchema,
});

export type MembershipApplicationInput = z.infer<
  typeof membershipApplicationSchema
>;

export const CREATIVE_DOMAIN_LABELS: Record<CreativeDomain, string> = {
  FILMMAKER: "Réalisateur·rice",
  PHOTOGRAPHER: "Photographe",
  SOUND_ENGINEER: "Ingénieur·e du son",
  VIDEOGRAPHER: "Vidéaste",
  LIGHTING_TECH: "Éclairagiste",
  EDITOR: "Monteur·se",
  PRODUCER: "Producteur·rice",
  OTHER: "Autre",
};

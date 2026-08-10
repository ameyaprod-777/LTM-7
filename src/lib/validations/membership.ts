import { z } from "zod";
import { CreativeDomain } from "@prisma/client";
import {
  acceptKycPolicySchema,
  acceptTermsSchema,
} from "@/lib/validations/legal";

const recentProjectSchema = z.object({
  title: z.string().max(150).optional().or(z.literal("")),
  url: z.string().url("URL invalide").optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
});

/** Schéma côté client : ne valide PAS les consentements
 *  (gérés par des useState externes à react-hook-form). */
export const membershipApplicationFormSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  /** Rempli via upload fichier (URL locale /api/avatars/…), pas saisie manuelle */
  image: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "Ville requise"),
  bio: z.string().min(20, "Bio : minimum 20 caractères").max(500),
  motivation: z
    .string()
    .min(50, "Expliquez votre motivation (min. 50 caractères)")
    .max(2000),
  creativeDomain: z.nativeEnum(CreativeDomain, {
    message: "Sélectionnez votre domaine créatif",
  }),
  /** Portfolio ou site web (un seul champ côté UI) */
  portfolioUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  instagramUrl: z.string().optional(),
  recentProjects: z.array(recentProjectSchema).max(3).optional(),
  invitationToken: z.string().optional(),
});

/** Schéma complet côté serveur : impose acceptTerms + acceptKycPolicy. */
export const membershipApplicationSchema = membershipApplicationFormSchema.extend({
  acceptTerms: acceptTermsSchema,
  acceptKycPolicy: acceptKycPolicySchema,
});

export type MembershipApplicationInput = z.infer<
  typeof membershipApplicationSchema
>;

export type MembershipApplicationFormInput = z.infer<
  typeof membershipApplicationFormSchema
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

import { z } from "zod";
import { CreativeDomain } from "@prisma/client";
import {
  acceptKycPolicySchema,
  acceptTermsSchema,
} from "@/lib/validations/legal";
import {
  MAX_PROFILE_PROJECTS,
  VIDEO_URL_ERROR,
  isYoutubeOrVimeoUrl,
} from "@/lib/video-embed";

const recentProjectSchema = z
  .object({
    title: z.string().max(150).optional().or(z.literal("")),
    url: z.string().optional().or(z.literal("")),
    description: z.string().max(300).optional().or(z.literal("")),
  })
  .superRefine((p, ctx) => {
    const url = (p.url ?? "").trim();
    if (!url) return;
    if (!isYoutubeOrVimeoUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: VIDEO_URL_ERROR,
      });
    }
  });

/** Schéma côté client : ne valide PAS les consentements
 *  (gérés par des useState externes à react-hook-form). */
export const membershipApplicationFormSchema = z
  .object({
    name: z.string().min(2, "Nom requis"),
    /** Rempli via upload fichier (URL locale /api/avatars/…), pas saisie manuelle */
    image: z.string().optional().or(z.literal("")),
    city: z.string().min(2, "Ville requise"),
    bio: z.string().min(20, "Bio : minimum 20 caractères").max(500),
    motivation: z.string().max(2000).optional().or(z.literal("")),
    creativeDomain: z.nativeEnum(CreativeDomain, {
      message: "Sélectionnez votre domaine créatif",
    }),
    /** Portfolio ou site web (un seul champ côté UI) */
    portfolioUrl: z.string().url("URL invalide").optional().or(z.literal("")),
    instagramUrl: z.string().optional(),
    recentProjects: z.array(recentProjectSchema).max(MAX_PROFILE_PROJECTS).optional(),
    invitationToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const invited = Boolean(data.invitationToken?.trim());
    const motivation = (data.motivation ?? "").trim();
    // Invitation : motivation facultative. Sinon min. 10 caractères.
    if (!invited && motivation.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivation"],
        message: "Expliquez votre motivation (min. 10 caractères)",
      });
    }
  });

/** Schéma complet côté serveur : impose acceptTerms + acceptKycPolicy. */
export const membershipApplicationSchema = membershipApplicationFormSchema.and(
  z.object({
    acceptTerms: acceptTermsSchema,
    acceptKycPolicy: acceptKycPolicySchema,
  })
);

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

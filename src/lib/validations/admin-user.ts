import { z } from "zod";
import { CreativeDomain, UserRole, UserStatus } from "@prisma/client";

export const adminUserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  city: z.string().max(100).optional().nullable(),
  neighborhood: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal("")),
  creativeDomain: z.nativeEnum(CreativeDomain).optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable().or(z.literal("")),
  instagramUrl: z.string().max(200).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  verifiedIdentity: z.boolean().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  PENDING: "En attente d'adhésion",
  MEMBER: "Membre communauté",
  MODERATOR: "Modérateur",
  ADMIN: "Super-administrateur",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  BANNED: "Banni",
};

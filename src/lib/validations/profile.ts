import { z } from "zod";
import { CreativeDomain } from "@prisma/client";

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Nom requis").optional(),
  city: z.string().min(2).optional().or(z.literal("")),
  neighborhood: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  creativeDomain: z.nativeEnum(CreativeDomain).optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

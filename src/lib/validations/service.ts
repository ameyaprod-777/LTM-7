import { z } from "zod";
import { ServiceCategory, ServiceRateType } from "@prisma/client";

function euroField(required: boolean) {
  return z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const n = typeof val === "number" ? val : Number(val);
      return Number.isNaN(n) ? undefined : n;
    },
    required
      ? z.number({ message: "Montant invalide" }).positive("Montant invalide")
      : z.number().positive().optional()
  );
}

function optionalExperienceYears() {
  return z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const n = typeof val === "number" ? val : Number(val);
      return Number.isNaN(n) ? undefined : n;
    },
    z.number().int().min(0).max(50).optional().nullable()
  );
}

export const serviceSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(30).max(5000),
  category: z.nativeEnum(ServiceCategory),
  rateType: z.nativeEnum(ServiceRateType),
  priceAmount: euroField(true),
  city: z.string().min(2),
  neighborhood: z.string().optional(),
  experienceYears: optionalExperienceYears(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  photoUrls: z
    .array(
      z
        .string()
        .min(1)
        .refine(
          (v) => v.startsWith("http") || v.startsWith("/api/services/photos/"),
          "URL photo invalide"
        )
    )
    .max(6),
});

export const serviceReportSchema = z.object({
  reason: z.string().min(10).max(2000),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

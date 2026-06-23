import { z } from "zod";

export const DAMAGE_TYPES = {
  SCRATCH: "Rayure / usure",
  BREAK: "Casse / panne",
  LOSS: "Perte / vol",
  OTHER: "Autre",
} as const;

export const damageReportSchema = z.object({
  damageType: z.enum(["SCRATCH", "BREAK", "LOSS", "OTHER"]),
  description: z.string().min(20).max(3000),
  estimatedCostEuros: z
    .union([z.number().min(0).max(100_000), z.nan()])
    .optional()
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : undefined)),
});

export type DamageReportInput = z.infer<typeof damageReportSchema>;

import { z } from "zod";
import { DeliverySlot } from "@prisma/client";
import { acceptMaterialTermsSchema } from "@/lib/validations/legal";

export const createBookingSchema = z.object({
  listingId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  pickupOrDelivery: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  deliverySlot: z.nativeEnum(DeliverySlot).optional(),
  acceptMaterialTerms: acceptMaterialTermsSchema,
});

export const patchBookingSchema = z
  .object({
    action: z.enum([
      "approve",
      "confirm",
      "cancel",
      "complete",
      "dispute",
      "report_damage",
      "resolve_dispute",
      "activate",
    ]),
    reason: z.string().max(2000).optional(),
    damageType: z.enum(["SCRATCH", "BREAK", "LOSS", "OTHER"]).optional(),
    description: z.string().max(3000).optional(),
    estimatedCostEuros: z.number().min(0).max(100_000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "dispute" && !data.reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez un motif pour le litige",
        path: ["reason"],
      });
    }
    if (data.action === "report_damage") {
      if (!data.description?.trim() || data.description.trim().length < 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Description du sinistre requise (min. 20 caractères)",
          path: ["description"],
        });
      }
      if (!data.damageType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Type de dommage requis",
          path: ["damageType"],
        });
      }
    }
  });

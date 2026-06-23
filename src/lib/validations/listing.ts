import { z } from "zod";
import {
  ListingCategory,
  ConditionRating,
  DeliveryOption,
  DeliveryPricingType,
  DeliverySlot,
  CancellationPolicy,
} from "@prisma/client";

const photoUrlSchema = z
  .string()
  .min(1)
  .refine(
    (v) => v.startsWith("http") || v.startsWith("/api/listings/photos/"),
    "URL photo invalide"
  );

/** Évite l'échec Zod quand un champ number HTML vide devient NaN. */
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

function optionalNonNegativeEuro() {
  return z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const n = typeof val === "number" ? val : Number(val);
      return Number.isNaN(n) ? undefined : n;
    },
    z.number().min(0).optional()
  );
}

export const listingSchema = z
  .object({
    title: z.string().min(5).max(120),
    description: z.string().min(20).max(5000),
    category: z.nativeEnum(ListingCategory),
    pricePerDay: euroField(true),
    pricePerWeek: euroField(false),
    weekendPricePerDay: euroField(false),
    condition: z.nativeEnum(ConditionRating),
    city: z.string().min(2),
    neighborhood: z.string().optional(),
    deliveryOption: z.nativeEnum(DeliveryOption),
    deliveryRadiusKm: euroField(false),
    deliveryPricingType: z.nativeEnum(DeliveryPricingType).optional().nullable(),
    deliveryFlatFee: optionalNonNegativeEuro(),
    deliveryFeePerKm: optionalNonNegativeEuro(),
    deliverySlots: z.array(z.nativeEnum(DeliverySlot)).optional(),
    cancellationPolicy: z.nativeEnum(CancellationPolicy),
    photoUrls: z.array(photoUrlSchema).max(10),
    tagNames: z.array(z.string().min(1).max(40)).max(8).optional(),
  })
  .superRefine((data, ctx) => {
    const needsDelivery =
      data.deliveryOption === "DELIVERY_AVAILABLE" ||
      data.deliveryOption === "BOTH";

    if (needsDelivery && !data.deliveryPricingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez un mode de tarification livraison",
        path: ["deliveryPricingType"],
      });
    }

    if (
      needsDelivery &&
      data.deliveryPricingType === "FLAT" &&
      data.deliveryFlatFee == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez les frais de livraison forfaitaires",
        path: ["deliveryFlatFee"],
      });
    }

    if (needsDelivery && data.deliveryPricingType === "PER_KM") {
      if (data.deliveryFeePerKm == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indiquez le tarif au km",
          path: ["deliveryFeePerKm"],
        });
      }
      if (data.deliveryRadiusKm == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indiquez le rayon de livraison",
          path: ["deliveryRadiusKm"],
        });
      }
    }
  });

export type ListingInput = z.infer<typeof listingSchema>;

/** Validation assouplie pour enregistrer un brouillon. */
export const listingDraftSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional(),
  category: z.nativeEnum(ListingCategory).optional(),
  pricePerDay: euroField(false),
  pricePerWeek: euroField(false),
  weekendPricePerDay: euroField(false),
  condition: z.nativeEnum(ConditionRating).optional(),
  city: z.string().max(100).optional(),
  neighborhood: z.string().optional(),
  deliveryOption: z.nativeEnum(DeliveryOption).optional(),
  deliveryRadiusKm: euroField(false),
  deliveryPricingType: z.nativeEnum(DeliveryPricingType).optional().nullable(),
  deliveryFlatFee: optionalNonNegativeEuro(),
  deliveryFeePerKm: optionalNonNegativeEuro(),
  deliverySlots: z.array(z.nativeEnum(DeliverySlot)).optional(),
  cancellationPolicy: z.nativeEnum(CancellationPolicy).optional(),
  photoUrls: z.array(photoUrlSchema).max(10).optional(),
  tagNames: z.array(z.string().min(1).max(40)).max(8).optional(),
});

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;

export const listingReportSchema = z.object({
  reason: z.string().min(10).max(2000),
});

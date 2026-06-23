import { z } from "zod";
import { ServicePaymentTiming } from "@prisma/client";

function optionalPositiveEuro() {
  return z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const n = typeof val === "number" ? val : Number(val);
      return Number.isNaN(n) ? undefined : n;
    },
    z.number({ message: "Montant invalide" }).positive("Montant invalide").optional()
  );
}

function optionalDateKey() {
  return z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    },
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)")
      .optional()
  );
}

export const createServiceQuoteSchema = z.object({
  brief: z
    .string()
    .trim()
    .min(20, "Décrivez votre besoin en au moins 20 caractères")
    .max(5000),
  startDate: optionalDateKey(),
  endDate: optionalDateKey(),
  proposedAmount: optionalPositiveEuro(),
  scopeImageRights: z.boolean({
    message: "Indiquez le périmètre droits image",
  }),
  scopeScheduleAgreed: z.boolean({
    message: "Indiquez le périmètre horaires",
  }),
  scopeDeliverablesAgreed: z.boolean({
    message: "Indiquez le périmètre livrables",
  }),
  acceptServiceTerms: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter le périmètre de prestation",
  }),
  paymentPreference: z.nativeEnum(ServicePaymentTiming).default(
    ServicePaymentTiming.UPFRONT
  ),
});

export const serviceQuoteActionSchema = z.object({
  action: z.enum(["accept", "reject"]),
  message: z.string().max(2000).optional(),
  /** Prestataire : accepter explicitement le paiement après prestation */
  acceptAfterPayment: z.boolean().optional(),
});

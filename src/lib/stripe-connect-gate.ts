import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripeConnectEnabled } from "@/lib/stripe-config";
import type { PayoutMethod } from "@prisma/client";

export const STRIPE_CONNECT_REQUIRED_CODE = "STRIPE_CONNECT_REQUIRED";
export const PAYOUT_SETUP_REQUIRED_CODE = "PAYOUT_SETUP_REQUIRED";

export const PAYOUT_SETUP_REQUIRED_MESSAGE =
  "Ajoutez votre IBAN (ou Stripe Connect) dans Paiements pour recevoir vos fonds avant de publier.";

export const STRIPE_CONNECT_REQUIRED_MESSAGE = PAYOUT_SETUP_REQUIRED_MESSAGE;

export const STRIPE_CONNECT_PAYMENTS_PATH = "/dashboard/settings/payments";
export const PAYOUT_SETTINGS_PATH = "/dashboard/settings/payments";

export type PayoutReadyFields = {
  payoutMethod: PayoutMethod;
  ibanLast4: string | null;
  ibanHolderName: string | null;
  ibanEncrypted: string | null;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
};

export function isStripeConnectReadyForPayouts(
  user: Pick<
    PayoutReadyFields,
    "stripeAccountId" | "stripeChargesEnabled" | "stripePayoutsEnabled"
  > | null | undefined
): boolean {
  if (!user) return false;
  return Boolean(
    user.stripeAccountId &&
      user.stripeChargesEnabled &&
      user.stripePayoutsEnabled
  );
}

/** IBAN enregistré = prêt pour virement SEPA manuel. */
export function isManualIbanReadyForPayouts(
  user: Pick<
    PayoutReadyFields,
    "ibanLast4" | "ibanHolderName" | "ibanEncrypted"
  > | null | undefined
): boolean {
  if (!user) return false;
  return Boolean(
    user.ibanEncrypted &&
      user.ibanLast4 &&
      user.ibanHolderName?.trim()
  );
}

/** Prêt à publier / recevoir : IBAN ou Connect. */
export function isPayoutReadyForPublish(
  user: PayoutReadyFields | null | undefined
): boolean {
  if (!user) return false;
  if (isManualIbanReadyForPayouts(user)) return true;
  if (stripeConnectEnabled() && isStripeConnectReadyForPayouts(user)) {
    return true;
  }
  // Connect désactivé sur la plateforme : IBAN obligatoire en prod
  if (!stripeConnectEnabled()) {
    return isManualIbanReadyForPayouts(user);
  }
  return false;
}

export async function getUserPayoutFields(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      payoutMethod: true,
      ibanLast4: true,
      ibanHolderName: true,
      ibanEncrypted: true,
      stripeAccountId: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    },
  });
}

/** @deprecated Prefer getUserPayoutFields */
export async function getUserStripeConnectFields(userId: string) {
  return getUserPayoutFields(userId);
}

/**
 * Bloque la publication si aucun moyen de recevoir les fonds
 * (IBAN manuel ou Stripe Connect complet).
 */
export async function assertStripeConnectReadyForPublish(userId: string): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  return assertPayoutReadyForPublish(userId);
}

export async function assertPayoutReadyForPublish(userId: string): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const user = await getUserPayoutFields(userId);
  if (isPayoutReadyForPublish(user)) {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: PAYOUT_SETUP_REQUIRED_MESSAGE,
        code: PAYOUT_SETUP_REQUIRED_CODE,
        redirectTo: PAYOUT_SETTINGS_PATH,
      },
      { status: 403 }
    ),
  };
}

export async function userNeedsStripeConnectSetup(userId: string): Promise<boolean> {
  return userNeedsPayoutSetup(userId);
}

export async function userNeedsPayoutSetup(userId: string): Promise<boolean> {
  const user = await getUserPayoutFields(userId);
  return !isPayoutReadyForPublish(user);
}

import type { Booking, Payment, User } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { stripeConnectEnabled, stripeEnabled } from "@/lib/stripe-config";
import {
  isManualIbanReadyForPayouts,
  isStripeConnectReadyForPayouts,
} from "@/lib/stripe-connect-gate";

type BookingWithListing = Booking & {
  listing: { title: string };
};

/**
 * Crée une session Checkout Stripe si les clés sont configurées.
 * Sinon retourne null (le caller gère le flux sans paiement).
 */
export async function createBookingCheckoutSession(
  booking: BookingWithListing,
  conversationId: string,
  startDate: string,
  endDate: string
): Promise<{ url: string; sessionId: string } | null> {
  if (!stripeEnabled() || !stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: booking.totalAmount,
          product_data: {
            name: booking.listing.title,
            description: `Location du ${startDate} au ${endDate}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/messages/${conversationId}?paid=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/listings/${booking.listingId}?cancelled=1`,
  });

  if (!session.url) return null;
  return { url: session.url, sessionId: session.id };
}

type ServiceQuoteCheckout = {
  id: string;
  proposedAmount: number;
  service: { title: string };
  conversationId: string | null;
};

export async function createServiceQuoteCheckoutSession(
  quote: ServiceQuoteCheckout,
  totalAmountCents: number,
  startDate?: string | null,
  endDate?: string | null
): Promise<{ url: string; sessionId: string } | null> {
  if (!stripeEnabled() || !stripe) return null;

  const period =
    startDate && endDate
      ? `Prestation du ${startDate} au ${endDate}`
      : "Prestation de service";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: totalAmountCents,
          product_data: {
            name: quote.service.title,
            description: period,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { serviceQuoteId: quote.id },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/messages/${quote.conversationId ?? ""}?paid=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/bookings?role=services&as=client`,
  });

  if (!session.url) return null;
  return { url: session.url, sessionId: session.id };
}

/**
 * Remboursement : mise à jour DB immédiate.
 * Appel Stripe `refunds.create` uniquement lorsque Stripe est configuré
 * et qu'un payment_intent est enregistré (pas un id de session checkout).
 */
export async function processBookingRefund(
  payment: Payment,
  refundAmountCents: number
): Promise<{ stripeRefundId: string | null }> {
  let stripeRefundId: string | null = null;

  const paymentIntentId = payment.stripePaymentId;
  const isPaymentIntent = paymentIntentId?.startsWith("pi_") ?? false;

  if (
    stripeEnabled() &&
    stripe &&
    isPaymentIntent &&
    refundAmountCents > 0
  ) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId!,
        amount: refundAmountCents,
      });
      stripeRefundId = refund.id;
    } catch (err) {
      console.error("[payment-service] refund Stripe échoué:", err);
    }
  }

  return { stripeRefundId };
}

export type ListerPayoutFields = Pick<
  User,
  | "stripeAccountId"
  | "stripeChargesEnabled"
  | "stripePayoutsEnabled"
  | "ibanEncrypted"
  | "ibanLast4"
  | "ibanHolderName"
  | "payoutMethod"
>;

export type ReleaseBookingFundsResult = {
  stripeTransferId: string | null;
  /** true → admin doit faire un virement SEPA */
  manualPayoutPending: boolean;
};

/**
 * Libération des fonds au loueur :
 * - Stripe Connect prêt → transfer automatique
 * - sinon IBAN → file d’attente virement manuel (admin)
 */
export async function releaseBookingFunds(
  payment: Payment,
  lister: ListerPayoutFields,
  listerNetAmount: number
): Promise<ReleaseBookingFundsResult> {
  let stripeTransferId: string | null = null;

  const canConnectTransfer =
    stripeConnectEnabled() &&
    stripe &&
    isStripeConnectReadyForPayouts(lister) &&
    payment.stripePaymentId?.startsWith("pi_");

  if (canConnectTransfer) {
    try {
      const transfer = await stripe!.transfers.create({
        amount: listerNetAmount,
        currency: "eur",
        destination: lister.stripeAccountId!,
        transfer_group: payment.bookingId,
      });
      stripeTransferId = transfer.id;
      return { stripeTransferId, manualPayoutPending: false };
    } catch (err) {
      console.error("[payment-service] transfer Stripe échoué:", err);
      // Fallback IBAN si disponible
    }
  }

  if (isManualIbanReadyForPayouts(lister)) {
    return { stripeTransferId: null, manualPayoutPending: true };
  }

  // Ni Connect ni IBAN : on marque quand même RELEASED mais sans payout
  console.warn(
    `[payment-service] Aucun moyen de payout pour booking ${payment.bookingId}`
  );
  return { stripeTransferId: null, manualPayoutPending: false };
}

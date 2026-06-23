import { stripe } from "@/lib/stripe";

/** Clé secrète Stripe présente et client initialisé */
export function stripeEnabled() {
  return !!stripe && !!process.env.STRIPE_SECRET_KEY;
}

/** Connect Express activé (nécessite STRIPE_CONNECT_ENABLED=true en plus des clés) */
export function stripeConnectEnabled() {
  return stripeEnabled() && process.env.STRIPE_CONNECT_ENABLED === "true";
}

/**
 * En production : réservation sans paiement Stripe interdite.
 * En dev : autorisé par défaut (désactiver avec ALLOW_DEV_BOOKING_WITHOUT_PAYMENT=false).
 */
export function allowBookingWithoutStripePayment() {
  if (stripeEnabled()) return false;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_DEV_BOOKING_WITHOUT_PAYMENT !== "false";
}

/** Formulaire de réservation actif (Stripe ou mode dev sans paiement) */
export function isBookingPaymentsAvailable() {
  return stripeEnabled() || allowBookingWithoutStripePayment();
}

export function paymentsUnavailableMessage() {
  return "Les paiements en ligne ne sont pas encore activés. Réessayez plus tard ou contactez le support.";
}

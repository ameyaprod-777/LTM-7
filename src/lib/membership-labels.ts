import type { ApplicationStatus } from "@prisma/client";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "En attente",
  INCOMPLETE: "Informations manquantes",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
};

export const APPLICATION_STATUS_STYLES: Record<
  ApplicationStatus,
  string
> = {
  PENDING: "bg-amber-100 text-amber-900",
  INCOMPLETE: "bg-orange-100 text-orange-900",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

/**
 * @deprecated Ancien système de KYC local. Le nouveau système Stripe Identity
 * n'a pas d'expiration côté application. Conservé pour rétro-compat.
 */
export function isIdentityExpired(
  identityExpiresAt: Date | null | undefined
): boolean {
  if (!identityExpiresAt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return identityExpiresAt < today;
}

/**
 * Renvoie true si l'identité est considérée comme vérifiée.
 * Priorité au nouveau champ Stripe Identity (`verifiedIdentity`).
 * Fallback rétro-compat sur l'ancien couple `kycVerifiedAt` + `identityExpiresAt`.
 */
export function hasVerifiedKycIdentity(user: {
  verifiedIdentity?: boolean | null;
  kycVerifiedAt?: Date | null;
  identityExpiresAt?: Date | null;
}): boolean {
  if (user.verifiedIdentity) return true;
  return !!user.kycVerifiedAt && !isIdentityExpired(user.identityExpiresAt);
}

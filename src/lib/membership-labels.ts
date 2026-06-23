import type { ApplicationStatus } from "@prisma/client";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "En attente",
  INCOMPLETE: "Pièces manquantes",
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

export function isIdentityExpired(
  identityExpiresAt: Date | null | undefined
): boolean {
  if (!identityExpiresAt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return identityExpiresAt < today;
}

export function hasVerifiedKycIdentity(user: {
  kycVerifiedAt: Date | null | undefined;
  identityExpiresAt: Date | null | undefined;
}): boolean {
  return !!user.kycVerifiedAt && !isIdentityExpired(user.identityExpiresAt);
}

/**
 * Traductions humaines des codes d'erreur renvoyés par Stripe Identity.
 * Partagé entre le composant candidat et le panneau admin.
 */
const ERROR_LABELS: Record<string, string> = {
  document_unverified_other: "Le document n'a pas pu être vérifié.",
  document_expired: "Le document est expiré.",
  document_type_not_supported: "Ce type de document n'est pas accepté.",
  selfie_document_missing_photo: "Le selfie ne correspond pas au document.",
  selfie_face_mismatch: "Le visage ne correspond pas au document.",
  selfie_unverified_other: "Le selfie n'a pas pu être vérifié.",
  under_supported_age: "Le candidat doit être majeur·e.",
  consent_declined: "Le candidat a refusé les conditions Stripe.",
};

export function humanizeStripeIdentityError(code?: string | null): string | null {
  if (!code) return null;
  return ERROR_LABELS[code] ?? "La vérification a échoué (voir Stripe Dashboard).";
}

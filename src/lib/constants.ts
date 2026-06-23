import type {
  ListingCategory,
  ListingStatus,
  ServiceCategory,
  ServiceRateType,
  ConditionRating,
  DeliveryOption,
  DeliveryPricingType,
  DeliverySlot,
  CancellationPolicy,
  BookingStatus,
  ForumSection,
  CreativeDomain,
} from "@prisma/client";

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  DRONE_FPV_PILOT: "Pilote drone FPV",
  DIRECTOR_OF_PHOTOGRAPHY: "Chef opérateur",
  CAMERA_OPERATOR: "Cadreur·se",
  STEADICAM_OPERATOR: "Steadicam",
  SOUND_RECORDIST: "Perchman·ne / Son",
  GAFFER: "Chef électricien·ne",
  EDITOR: "Monteur·se",
  COLORIST: "Étalonneur·se",
  PRODUCER: "Producteur·rice",
  MAKEUP_ARTIST: "Maquilleur·se",
  OTHER: "Autre prestation",
};

export const SERVICE_RATE_LABELS: Record<ServiceRateType, string> = {
  HOURLY: "à l'heure",
  DAILY: "à la journée",
  PROJECT: "au forfait",
};

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  CAMERA: "Caméra",
  LENS: "Optique",
  LIGHTING: "Éclairage",
  SOUND: "Son",
  STABILIZER: "Stabilisation",
  DRONE: "Drone",
  ACCESSORIES: "Accessoires",
};

export const CONDITION_LABELS: Record<ConditionRating, string> = {
  NEW: "Neuf",
  EXCELLENT: "Excellent",
  GOOD: "Bon",
  FAIR: "Correct",
};

export const DELIVERY_OPTION_LABELS: Record<DeliveryOption, string> = {
  PICKUP_ONLY: "Retrait uniquement",
  DELIVERY_AVAILABLE: "Livraison uniquement",
  BOTH: "Retrait ou livraison",
};

export const DELIVERY_PRICING_LABELS: Record<DeliveryPricingType, string> = {
  FLAT: "Forfait fixe",
  PER_KM: "Au kilomètre (estimation sur rayon max.)",
};

export const DELIVERY_SLOT_LABELS: Record<DeliverySlot, string> = {
  MORNING: "Matin",
  AFTERNOON: "Après-midi",
  EVENING: "Soir",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Active",
  PAUSED: "En pause",
  REMOVED: "Supprimée",
};

export const CANCELLATION_LABELS: Record<CancellationPolicy, string> = {
  FLEXIBLE: "Flexible",
  MODERATE: "Modérée",
  STRICT: "Stricte",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  ACTIVE: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  DISPUTED: "En litige",
};

export const SERVICE_PAYMENT_TIMING_LABELS: Record<
  import("@prisma/client").ServicePaymentTiming,
  string
> = {
  UPFRONT: "Paiement direct",
  AFTER_SERVICE: "Après prestation",
};

export const SERVICE_QUOTE_STATUS_LABELS: Record<
  import("@prisma/client").ServiceQuoteStatus,
  string
> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminée",
};

export const SERVICE_QUOTE_PAYMENT_METHOD_LABELS: Record<
  import("@prisma/client").ServiceQuotePaymentMethod,
  string
> = {
  STRIPE: "Carte (Stripe)",
  CASH: "Espèces",
};

export const PAYMENT_STATUS_LABELS: Record<
  import("@prisma/client").PaymentStatus,
  string
> = {
  PENDING: "En attente de paiement",
  HELD: "Fonds séquestrés",
  RELEASED: "Versé au loueur",
  REFUNDED: "Remboursé",
  FAILED: "Échec",
};

export const DELIVERY_TASK_STATUS_LABELS: Record<
  import("@prisma/client").DeliveryTaskStatus,
  string
> = {
  PENDING: "À planifier",
  SCHEDULED: "Planifiée",
  IN_TRANSIT: "En cours",
  DELIVERED: "Livrée",
  RETURNED: "Retournée",
};

export const FORUM_SECTION_LABELS: Record<ForumSection, string> = {
  GENERAL: "Général",
  MATERIEL_TECH: "Matériel & Tech",
  PROJETS_CASTING: "Projets & Casting",
  CONSEILS_ASTUCES: "Conseils & Astuces",
  PETITES_ANNONCES: "Petites annonces",
};

export const CREATIVE_DOMAIN_LABELS: Record<CreativeDomain, string> = {
  FILMMAKER: "Réalisateur·rice",
  PHOTOGRAPHER: "Photographe",
  SOUND_ENGINEER: "Ingénieur·e du son",
  VIDEOGRAPHER: "Vidéaste",
  LIGHTING_TECH: "Éclairagiste",
  EDITOR: "Monteur·se",
  PRODUCER: "Producteur·rice",
  OTHER: "Autre",
};

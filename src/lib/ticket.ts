import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";

/** Valeurs utilisables côté client (sans enum Prisma runtime). */
export const TICKET_CATEGORIES = [
  "TECHNICAL",
  "BOOKING_DISPUTE",
  "ACCOUNT",
  "BILLING",
  "OTHER",
] as const;

export type TicketCategorySlug = (typeof TICKET_CATEGORIES)[number];

export const DEFAULT_TICKET_CATEGORY: TicketCategorySlug = "OTHER";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL: "Technique",
  BOOKING_DISPUTE: "Litige location",
  ACCOUNT: "Compte & adhésion",
  BILLING: "Paiement & facturation",
  OTHER: "Autre",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
};

import { ForumPostType, ForumSection } from "@prisma/client";

export const FORUM_POST_TYPE_LABELS: Record<ForumPostType, string> = {
  ACTU: "Actu",
  PROJECT: "Projet",
  NEED: "Besoin",
};

export const FORUM_POST_TYPE_DESCRIPTIONS: Record<ForumPostType, string> = {
  ACTU: "Partagez une actu, une info ou une question rapide",
  PROJECT: "Présentez un projet récent ou en cours",
  NEED: "Cherchez du matériel, une personne ou une urgence tournage",
};

export function postTypeToSection(type: ForumPostType): ForumSection {
  switch (type) {
    case ForumPostType.PROJECT:
      return ForumSection.PROJETS_CASTING;
    case ForumPostType.NEED:
      return ForumSection.PETITES_ANNONCES;
    default:
      return ForumSection.GENERAL;
  }
}

export const FORUM_FEED_FILTERS: { value: ForumPostType | "ALL"; label: string }[] =
  [
    { value: "ALL", label: "Tout le fil" },
    { value: ForumPostType.ACTU, label: "Actus" },
    { value: ForumPostType.PROJECT, label: "Projets" },
    { value: ForumPostType.NEED, label: "Besoins" },
  ];

export const FORUM_SECTION_FILTERS: { value: ForumSection | "ALL"; label: string }[] =
  [
    { value: "ALL", label: "Toutes sections" },
    { value: ForumSection.GENERAL, label: "Général" },
    { value: ForumSection.MATERIEL_TECH, label: "Matériel & Tech" },
    { value: ForumSection.PROJETS_CASTING, label: "Projets & Casting" },
    { value: ForumSection.CONSEILS_ASTUCES, label: "Conseils & Astuces" },
    { value: ForumSection.PETITES_ANNONCES, label: "Petites annonces" },
  ];

export { FORUM_SECTION_LABELS } from "@/lib/constants";

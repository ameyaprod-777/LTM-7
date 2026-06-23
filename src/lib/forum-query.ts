import type { ForumPostType, ForumSection, Prisma } from "@prisma/client";

export const FORUM_EDIT_WINDOW_MS = 15 * 60 * 1000;

export const URGENT_NEED_HOURS = 48;

export type ForumFeedParams = {
  type?: ForumPostType;
  section?: ForumSection;
  tag?: string;
  q?: string;
};

export function buildForumPostWhere(params: ForumFeedParams): Prisma.ForumPostWhereInput {
  const where: Prisma.ForumPostWhereInput = {};

  if (params.type) {
    where.postType = params.type;
  }

  if (params.section) {
    where.section = params.section;
  }

  if (params.tag?.trim()) {
    const tag = params.tag.trim().toLowerCase().replace(/^#/, "");
    where.tags = { has: tag };
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function canEditForumContent(createdAt: Date) {
  return Date.now() - createdAt.getTime() <= FORUM_EDIT_WINDOW_MS;
}

export function isUrgentNeed(eventAt: Date | null | undefined) {
  if (!eventAt) return false;
  const diff = eventAt.getTime() - Date.now();
  return diff > 0 && diff <= URGENT_NEED_HOURS * 60 * 60 * 1000;
}

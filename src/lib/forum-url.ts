import type { ForumPostType, ForumSection } from "@prisma/client";

export type ForumUrlParams = {
  type?: ForumPostType;
  section?: ForumSection;
  tag?: string;
  q?: string;
};

export function buildForumUrl(params: ForumUrlParams) {
  const sp = new URLSearchParams();
  if (params.type) sp.set("type", params.type);
  if (params.section) sp.set("section", params.section);
  if (params.tag) sp.set("tag", params.tag);
  if (params.q) sp.set("q", params.q);
  const qs = sp.toString();
  return qs ? `/forum?${qs}` : "/forum";
}

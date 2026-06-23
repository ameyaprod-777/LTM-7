"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { FORUM_FEED_FILTERS, FORUM_SECTION_FILTERS } from "@/lib/forum";
import { buildForumUrl } from "@/lib/forum-url";
import type { ForumPostType, ForumSection } from "@prisma/client";

type Props = {
  typeFilter?: ForumPostType;
  sectionFilter?: ForumSection;
  tagFilter?: string;
  qFilter?: string;
};

export function ForumFeedToolbar({
  typeFilter,
  sectionFilter,
  tagFilter,
  qFilter,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(qFilter ?? "");
  const [tag, setTag] = useState(tagFilter ?? "");

  const base = { type: typeFilter, section: sectionFilter };

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      buildForumUrl({
        ...base,
        tag: tag.trim() || undefined,
        q: q.trim() || undefined,
      })
    );
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        {FORUM_FEED_FILTERS.map(({ value, label }) => {
          const href =
            value === "ALL"
              ? buildForumUrl({ section: sectionFilter, tag: tagFilter, q: qFilter })
              : buildForumUrl({
                  type: value,
                  section: sectionFilter,
                  tag: tagFilter,
                  q: qFilter,
                });
          const active = value === "ALL" ? !typeFilter : typeFilter === value;
          return (
            <a
              key={value}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-white shadow-sm"
                  : "bg-white text-anthracite-600 ring-1 ring-anthracite-200 hover:ring-accent/40"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {FORUM_SECTION_FILTERS.map(({ value, label }) => {
          const href =
            value === "ALL"
              ? buildForumUrl({ type: typeFilter, tag: tagFilter, q: qFilter })
              : buildForumUrl({
                  type: typeFilter,
                  section: value,
                  tag: tagFilter,
                  q: qFilter,
                });
          const active =
            value === "ALL" ? !sectionFilter : sectionFilter === value;
          return (
            <a
              key={value}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-anthracite-800 text-white"
                  : "bg-anthracite-50 text-anthracite-600 hover:bg-anthracite-100"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      <form onSubmit={search} className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-anthracite-400" />
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher dans le fil…"
            className="w-full rounded-lg border border-anthracite-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <input
          name="tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#tag"
          className="w-28 rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-anthracite-800 px-4 py-2 text-sm font-medium text-white hover:bg-anthracite-900"
        >
          Filtrer
        </button>
      </form>
    </div>
  );
}

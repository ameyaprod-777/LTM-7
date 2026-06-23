import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MembersSearchParams } from "@/lib/members-query";

const PAGE_SIZE = 24;

export function membersPageSize() {
  return PAGE_SIZE;
}

function buildHref(
  params: MembersSearchParams & { page?: string },
  page: number
) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.domain) sp.set("domain", params.domain);
  if (params.city) sp.set("city", params.city);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/members?${qs}` : "/members";
}

export function MembersPagination({
  totalCount,
  currentPage,
  searchParams,
}: {
  totalCount: number;
  currentPage: number;
  searchParams: MembersSearchParams;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
      aria-label="Pagination annuaire"
    >
      <p className="text-sm text-anthracite-500">
        {from}–{to} sur {totalCount} membre{totalCount > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(searchParams, currentPage - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-anthracite-200 px-3 py-2 text-sm font-medium text-anthracite-700 hover:border-accent hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-anthracite-100 px-3 py-2 text-sm text-anthracite-300">
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </span>
        )}
        <span className="px-2 text-sm text-anthracite-600">
          Page {currentPage} / {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link
            href={buildHref(searchParams, currentPage + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-anthracite-200 px-3 py-2 text-sm font-medium text-anthracite-700 hover:border-accent hover:text-accent"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-anthracite-100 px-3 py-2 text-sm text-anthracite-300">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}

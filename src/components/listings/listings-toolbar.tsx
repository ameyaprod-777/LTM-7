"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Map,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Camera,
  Aperture,
  Lightbulb,
  Mic,
  Move,
  Plane,
  Package2,
  type LucideIcon,
} from "lucide-react";
import { ListingCategory } from "@prisma/client";
import { CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES: { value: ListingCategory | "ALL"; label: string; icon: LucideIcon }[] = [
  { value: "ALL", label: "Tout", icon: LayoutGrid },
  { value: ListingCategory.CAMERA, label: CATEGORY_LABELS.CAMERA, icon: Camera },
  { value: ListingCategory.LENS, label: CATEGORY_LABELS.LENS, icon: Aperture },
  { value: ListingCategory.LIGHTING, label: CATEGORY_LABELS.LIGHTING, icon: Lightbulb },
  { value: ListingCategory.SOUND, label: CATEGORY_LABELS.SOUND, icon: Mic },
  { value: ListingCategory.STABILIZER, label: CATEGORY_LABELS.STABILIZER, icon: Move },
  { value: ListingCategory.DRONE, label: CATEGORY_LABELS.DRONE, icon: Plane },
  { value: ListingCategory.ACCESSORIES, label: CATEGORY_LABELS.ACCESSORIES, icon: Package2 },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récentes" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Props = {
  showMapLink?: boolean;
  activeView?: "list" | "map";
  resultCount?: number;
};

export function ListingsToolbar({
  showMapLink = false,
  activeView = "list",
  resultCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = searchParams.get("category") ?? "ALL";
  const activeSort = (searchParams.get("sort") as SortValue) ?? "recent";
  const activeCity = searchParams.get("city") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query.trim() === current.trim()) return;
      updateParams({ q: query.trim() || null });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchParams, updateParams]);

  const hasFilters =
    activeCategory !== "ALL" ||
    activeSort !== "recent" ||
    !!activeCity ||
    !!searchParams.get("q");

  const resetFilters = () => {
    setQuery("");
    startTransition(() => router.push(pathname, { scroll: false }));
  };

  const listHref = `/listings${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const mapHref = `/listings/map${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-anthracite-400" />
          <Input
            type="search"
            placeholder="Rechercher une caméra, un objectif, une ville…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-xl border-anthracite-200 bg-white pl-10 pr-10 text-base shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                updateParams({ q: null });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-anthracite-400 hover:bg-anthracite-100 hover:text-anthracite"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
              showFilters || hasFilters
                ? "border-accent bg-accent-muted text-accent"
                : "border-anthracite-200 bg-white text-anthracite-600 hover:bg-anthracite-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {hasFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
                !
              </span>
            )}
          </button>

          {showMapLink && (
            <div className="flex rounded-xl border border-anthracite-200 bg-white p-1 shadow-sm">
              <Link
                href={listHref}
                className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                  activeView === "list"
                    ? "bg-accent text-white"
                    : "text-anthracite-500 hover:bg-anthracite-50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Liste</span>
              </Link>
              <Link
                href={mapHref}
                className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                  activeView === "map"
                    ? "bg-accent text-white"
                    : "text-anthracite-500 hover:bg-anthracite-50"
                }`}
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Carte</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map(({ value, label, icon: Icon }) => {
          const active = activeCategory === value || (value === "ALL" && !searchParams.get("category"));
          return (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() =>
                updateParams({ category: value === "ALL" ? null : value })
              }
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "border-accent bg-accent text-white shadow-md shadow-accent/25"
                  : "border-anthracite-200 bg-white text-anthracite-600 hover:border-accent/40 hover:bg-accent-muted/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {(showFilters || hasFilters) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-anthracite-100 bg-anthracite-50/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor="city-filter" className="text-sm text-anthracite-500">
              Ville
            </label>
            <input
              id="city-filter"
              type="text"
              placeholder="Paris, Lyon…"
              defaultValue={activeCity}
              onBlur={(e) =>
                updateParams({ city: e.target.value.trim() || null })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateParams({
                    city: (e.target as HTMLInputElement).value.trim() || null,
                  });
                }
              }}
              className="h-9 w-36 rounded-lg border border-anthracite-200 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-filter" className="text-sm text-anthracite-500">
              Trier par
            </label>
            <select
              id="sort-filter"
              value={activeSort}
              disabled={pending}
              onChange={(e) =>
                updateParams({ sort: e.target.value === "recent" ? null : e.target.value })
              }
              className="h-9 rounded-lg border border-anthracite-200 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Tout effacer
            </Button>
          )}
        </div>
      )}

      {typeof resultCount === "number" && (
        <p className={`text-sm text-anthracite-500 ${pending ? "opacity-60" : ""}`}>
          {resultCount === 0
            ? "Aucun résultat"
            : `${resultCount} annonce${resultCount > 1 ? "s" : ""}`}
          {searchParams.get("q") && (
            <>
              {" "}
              pour « <span className="font-medium text-anthracite">{searchParams.get("q")}</span> »
            </>
          )}
        </p>
      )}
    </div>
  );
}

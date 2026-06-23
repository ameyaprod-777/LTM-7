"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Plane,
  Video,
  Camera,
  Move,
  Mic,
  Lightbulb,
  Scissors,
  Palette,
  Briefcase,
  Sparkles,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { ServiceCategory } from "@prisma/client";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES: {
  value: ServiceCategory | "ALL";
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "ALL", label: "Tout", icon: LayoutGrid },
  {
    value: ServiceCategory.DRONE_FPV_PILOT,
    label: SERVICE_CATEGORY_LABELS.DRONE_FPV_PILOT,
    icon: Plane,
  },
  {
    value: ServiceCategory.DIRECTOR_OF_PHOTOGRAPHY,
    label: SERVICE_CATEGORY_LABELS.DIRECTOR_OF_PHOTOGRAPHY,
    icon: Video,
  },
  {
    value: ServiceCategory.CAMERA_OPERATOR,
    label: SERVICE_CATEGORY_LABELS.CAMERA_OPERATOR,
    icon: Camera,
  },
  {
    value: ServiceCategory.STEADICAM_OPERATOR,
    label: SERVICE_CATEGORY_LABELS.STEADICAM_OPERATOR,
    icon: Move,
  },
  {
    value: ServiceCategory.SOUND_RECORDIST,
    label: SERVICE_CATEGORY_LABELS.SOUND_RECORDIST,
    icon: Mic,
  },
  {
    value: ServiceCategory.GAFFER,
    label: SERVICE_CATEGORY_LABELS.GAFFER,
    icon: Lightbulb,
  },
  {
    value: ServiceCategory.EDITOR,
    label: SERVICE_CATEGORY_LABELS.EDITOR,
    icon: Scissors,
  },
  {
    value: ServiceCategory.COLORIST,
    label: SERVICE_CATEGORY_LABELS.COLORIST,
    icon: Palette,
  },
  {
    value: ServiceCategory.PRODUCER,
    label: SERVICE_CATEGORY_LABELS.PRODUCER,
    icon: Briefcase,
  },
  {
    value: ServiceCategory.MAKEUP_ARTIST,
    label: SERVICE_CATEGORY_LABELS.MAKEUP_ARTIST,
    icon: Sparkles,
  },
  {
    value: ServiceCategory.OTHER,
    label: SERVICE_CATEGORY_LABELS.OTHER,
    icon: MoreHorizontal,
  },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "price_asc", label: "Tarif croissant" },
  { value: "price_desc", label: "Tarif décroissant" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function ServicesToolbar({ resultCount }: { resultCount?: number }) {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-anthracite-400" />
          <Input
            type="search"
            placeholder="Chef op, pilote FPV, monteur, ville…"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-anthracite-400 hover:bg-anthracite-100"
              aria-label="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium ${
            showFilters || hasFilters
              ? "border-accent bg-accent-muted text-accent"
              : "border-anthracite-200 bg-white text-anthracite-600 hover:bg-anthracite-50"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </button>
      </div>

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map(({ value, label, icon: Icon }) => {
          const active =
            activeCategory === value ||
            (value === "ALL" && !searchParams.get("category"));
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
                  : "border-anthracite-200 bg-white text-anthracite-600 hover:border-accent/40"
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
            <label htmlFor="svc-city" className="text-sm text-anthracite-500">
              Ville
            </label>
            <input
              id="svc-city"
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
          <select
            value={activeSort}
            disabled={pending}
            onChange={(e) =>
              updateParams({ sort: e.target.value === "recent" ? null : e.target.value })
            }
            className="h-9 rounded-lg border border-anthracite-200 bg-white px-3 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
            : `${resultCount} prestation${resultCount > 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CreativeDomain } from "@prisma/client";
import { CREATIVE_DOMAIN_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DOMAINS: { value: CreativeDomain | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous les métiers" },
  ...Object.entries(CREATIVE_DOMAIN_LABELS).map(([value, label]) => ({
    value: value as CreativeDomain,
    label,
  })),
];

export function MembersToolbar({ resultCount }: { resultCount?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const activeDomain = searchParams.get("domain") ?? "ALL";
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
    activeDomain !== "ALL" || !!activeCity || !!searchParams.get("q");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-anthracite-400" />
          <Input
            type="search"
            placeholder="Nom, ville, métier…"
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
              : "border-anthracite-200 bg-white text-anthracite-600"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {DOMAINS.map(({ value, label }) => {
          const active =
            activeDomain === value ||
            (value === "ALL" && !searchParams.get("domain"));
          return (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() =>
                updateParams({ domain: value === "ALL" ? null : value })
              }
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-anthracite-200 bg-white text-anthracite-600 hover:border-accent/40"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {(showFilters || hasFilters) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-anthracite-100 bg-anthracite-50/60 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-anthracite-500">
            Ville
            <input
              type="text"
              placeholder="Paris…"
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
              className="h-9 w-32 rounded-lg border border-anthracite-200 bg-white px-3 text-sm"
            />
          </label>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                startTransition(() => router.push(pathname, { scroll: false }));
              }}
            >
              Tout effacer
            </Button>
          )}
        </div>
      )}

      {typeof resultCount === "number" && (
        <p className={`text-sm text-anthracite-500 ${pending ? "opacity-60" : ""}`}>
          {resultCount} membre{resultCount > 1 ? "s" : ""} dans la communauté
        </p>
      )}
    </div>
  );
}

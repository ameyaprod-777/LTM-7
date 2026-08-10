"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Search, Loader2 } from "lucide-react";
import { haversineKm, formatDistance } from "@/lib/distance";
import { formatCents } from "@/lib/money";
import { toSameOriginMediaUrl } from "@/lib/upload-root";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MapListing = {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  pricePerDay: number;
  lat: number;
  lng: number;
  photo: string | null;
};

type GeoPoint = { lat: number; lng: number; label?: string };

const MapCanvas = dynamic(
  () => import("./listings-map-canvas").then((m) => m.ListingsMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl bg-anthracite-100 text-anthracite-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

export function ListingsMapView() {
  const [listings, setListings] = useState<MapListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [reference, setReference] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/listings/map");
    if (res.ok) {
      setListings(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const sortedListings = useMemo(() => {
    if (!reference) return listings;
    return [...listings]
      .map((l) => ({
        ...l,
        distance: haversineKm(reference.lat, reference.lng, l.lat, l.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [listings, reference]);

  const useMyPosition = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par votre navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReference({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Ma position",
        });
      },
      () => setError("Impossible d'obtenir votre position. Autorisez la localisation."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchLocation = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setError(null);
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setSearching(false);
    if (!res.ok) {
      setError(data.error ?? "Lieu introuvable");
      return;
    }
    setReference({ lat: data.lat, lng: data.lng, label: search });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
      <aside className="flex w-full flex-col gap-4 lg:w-96 lg:shrink-0">
        <div className="rounded-2xl border border-anthracite-100 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-anthracite">Point de référence</h2>
          <p className="mt-1 text-xs text-anthracite-500">
            Votre position ou le lieu de tournage pour trier par distance.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={useMyPosition}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Ma position
          </Button>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              searchLocation();
            }}
          >
            <Input
              placeholder="Lieu de tournage (ex. Bastille, Paris)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" loading={searching} size="sm" aria-label="Rechercher">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {reference && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-accent-muted px-3 py-2 text-xs text-anthracite">
              <MapPin className="h-4 w-4 shrink-0 text-accent" />
              <span>
                Référence : <strong>{reference.label ?? "Point choisi"}</strong>
              </span>
            </p>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex-1 overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm">
          <p className="border-b border-anthracite-100 px-4 py-3 text-sm font-medium text-anthracite">
            {reference
              ? `${sortedListings.length} annonce(s) — plus proches en premier`
              : `${listings.length} annonce(s) sur la carte`}
          </p>
          <ul className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <li className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-anthracite-400" />
              </li>
            ) : (
              sortedListings.map((listing) => (
                <li key={listing.id} className="border-b border-anthracite-50 last:border-0">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="flex gap-3 p-4 transition-colors hover:bg-anthracite-50"
                  >
                    <div
                      className="h-14 w-14 shrink-0 rounded-lg bg-anthracite-100 bg-cover bg-center"
                      style={
                        listing.photo
                          ? {
                              backgroundImage: `url(${
                                toSameOriginMediaUrl(listing.photo) ??
                                listing.photo
                              })`,
                            }
                          : undefined
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-anthracite">
                        {listing.title}
                      </p>
                      <p className="text-xs text-anthracite-500">
                        {listing.city}
                        {listing.neighborhood && ` · ${listing.neighborhood}`}
                      </p>
                      <p className="mt-1 text-sm font-medium text-accent">
                        {formatCents(listing.pricePerDay)} / jour
                        {"distance" in listing && reference && (
                          <span className="ml-2 text-anthracite-400">
                            · {formatDistance(listing.distance as number)}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>

      <div className="min-h-[480px] flex-1 overflow-hidden rounded-2xl border border-anthracite-100 shadow-sm lg:min-h-[600px]">
        {!loading && (
          <MapCanvas
            listings={sortedListings.map(({ id, title, city, pricePerDay, lat, lng }) => ({
              id,
              title,
              city,
              pricePerDay,
              lat,
              lng,
            }))}
            reference={reference}
            onSelectReference={setReference}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatCents } from "@/lib/money";
import { BRAND_ACCENT } from "@/lib/brand-colors";

type MapListing = {
  id: string;
  title: string;
  city: string;
  pricePerDay: number;
  lat: number;
  lng: number;
};

type GeoPoint = { lat: number; lng: number; label?: string };

const listingIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:${BRAND_ACCENT};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const refIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#1a1d23;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapClickHandler({
  onSelectReference,
}: {
  onSelectReference: (p: GeoPoint) => void;
}) {
  useMapEvents({
    click(e) {
      onSelectReference({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        label: "Point sur la carte",
      });
    },
  });
  return null;
}

function MapController({
  listings,
  reference,
}: {
  listings: MapListing[];
  reference: GeoPoint | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = listings.map((l) => [l.lat, l.lng]);
    if (reference) points.push([reference.lat, reference.lng]);
    if (points.length === 0) {
      map.setView([46.6, 2.4], 6);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0] as L.LatLngExpression, 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 13 });
  }, [listings, reference, map]);

  return null;
}

export function ListingsMapCanvas({
  listings,
  reference,
  onSelectReference,
}: {
  listings: MapListing[];
  reference: GeoPoint | null;
  onSelectReference: (p: GeoPoint) => void;
}) {
  return (
    <MapContainer
      center={[46.6, 2.4]}
      zoom={6}
      className="h-full w-full min-h-[480px] z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onSelectReference={onSelectReference} />
      <MapController listings={listings} reference={reference} />

      {reference && (
        <>
          <Marker position={[reference.lat, reference.lng]} icon={refIcon}>
            <Popup>{reference.label ?? "Votre référence"}</Popup>
          </Marker>
          <Circle
            center={[reference.lat, reference.lng]}
            radius={25000}
            pathOptions={{
              color: BRAND_ACCENT,
              fillColor: BRAND_ACCENT,
              fillOpacity: 0.06,
              weight: 1,
            }}
          />
        </>
      )}

      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={listingIcon}
        >
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-semibold text-anthracite">{listing.title}</p>
              <p className="text-sm text-anthracite-500">{listing.city}</p>
              <p className="mt-1 text-sm font-medium text-accent">
                {formatCents(listing.pricePerDay)} / jour
              </p>
              <Link
                href={`/listings/${listing.id}`}
                className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
              >
                Voir l&apos;annonce →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

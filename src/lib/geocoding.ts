const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  paris: { lat: 48.8566, lng: 2.3522 },
  lyon: { lat: 45.764, lng: 4.8357 },
  marseille: { lat: 43.2965, lng: 5.3698 },
  toulouse: { lat: 43.6047, lng: 1.4442 },
  nice: { lat: 43.7102, lng: 7.262 },
  nantes: { lat: 47.2184, lng: -1.5536 },
  bordeaux: { lat: 44.8378, lng: -0.5792 },
  lille: { lat: 50.6292, lng: 3.0573 },
  rennes: { lat: 48.1173, lng: -1.6778 },
  strasbourg: { lat: 48.5734, lng: 7.7521 },
  montpellier: { lat: 43.6108, lng: 3.8767 },
  grenoble: { lat: 45.1885, lng: 5.7245 },
};

export type GeoPoint = { lat: number; lng: number };

function normalizeCity(city: string) {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function geocodeLocation(
  city: string,
  neighborhood?: string | null
): Promise<GeoPoint | null> {
  const normalized = normalizeCity(city);
  if (CITY_COORDS[normalized]) {
    return CITY_COORDS[normalized];
  }

  try {
    const query = [neighborhood, city, "France"].filter(Boolean).join(", ");
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "LoueTonMatos/1.0 (contact@louetonmatos.fr)" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function geocodeQuery(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const asCity = CITY_COORDS[normalizeCity(trimmed)];
  if (asCity) return asCity;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed + ", France")}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "LoueTonMatos/1.0 (contact@louetonmatos.fr)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

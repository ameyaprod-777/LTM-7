import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { geocodeLocation } from "@/lib/geocoding";

export async function GET() {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
    },
  });

  const withCoords = await Promise.all(
    listings.map(async (listing) => {
      let lat = listing.latitude;
      let lng = listing.longitude;

      if (lat == null || lng == null) {
        const geo = await geocodeLocation(listing.city, listing.neighborhood);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
          await prisma.listing.update({
            where: { id: listing.id },
            data: { latitude: lat, longitude: lng },
          });
        }
      }

      if (lat == null || lng == null) return null;

      return {
        id: listing.id,
        title: listing.title,
        city: listing.city,
        neighborhood: listing.neighborhood,
        pricePerDay: listing.pricePerDay,
        category: listing.category,
        lat,
        lng,
        photo: listing.photos[0]?.url ?? null,
      };
    })
  );

  return NextResponse.json(withCoords.filter(Boolean));
}

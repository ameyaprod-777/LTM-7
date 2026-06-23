import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, getApiSession, forbidden } from "@/lib/api-auth";
import { getAccessTier } from "@/lib/permissions";
import {
  listingDetailInclude,
  shapeListingForApi,
} from "@/lib/listing-api";
import { listingSchema } from "@/lib/validations/listing";
import { listingDataFromInput } from "@/lib/listing-payload";
import { syncListingTags } from "@/lib/listing-tags";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tier = getAccessTier(
    true,
    session.user.role,
    session.user.status
  );

  if (tier === "visitor") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: listingDetailInclude(),
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  return NextResponse.json(shapeListingForApi(listing, tier));
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }
  if (
    listing.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  const body = await req.json();
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const { geocodeLocation } = await import("@/lib/geocoding");
  let coords: { lat: number; lng: number } | null | undefined;
  if (data.city !== undefined) {
    coords = await geocodeLocation(
      data.city,
      data.neighborhood ?? listing.neighborhood
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.photoUrls) {
      await tx.listingPhoto.deleteMany({ where: { listingId: params.id } });
      await tx.listingPhoto.createMany({
        data: data.photoUrls.map((url, order) => ({
          listingId: params.id,
          url,
          order,
        })),
      });
    }

    if (data.tagNames) {
      await syncListingTags(tx, params.id, data.tagNames);
    }

    return tx.listing.update({
      where: { id: params.id },
      data: listingDataFromInput(data, coords),
      include: {
        photos: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
      },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }
  if (
    listing.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  if (listing.status === "REMOVED") {
    return NextResponse.json({ ok: true });
  }

  const activeBookings = await prisma.booking.count({
    where: {
      listingId: params.id,
      status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer : des réservations sont en cours ou en attente.",
      },
      { status: 409 }
    );
  }

  await prisma.listing.update({
    where: { id: params.id },
    data: { status: "REMOVED" },
  });

  return NextResponse.json({ ok: true });
}

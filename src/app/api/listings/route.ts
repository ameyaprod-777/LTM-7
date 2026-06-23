import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { listingDraftSchema, listingSchema } from "@/lib/validations/listing";
import { listingDataFromInput } from "@/lib/listing-payload";
import { draftListingDataFromInput } from "@/lib/listing-draft";
import { syncListingTags } from "@/lib/listing-tags";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const mine = searchParams.get("mine") === "1";

  if (mine) {
    const auth = await requireMemberApi();
    if ("error" in auth) return auth.error;

    const listings = await prisma.listing.findMany({
      where: { ownerId: auth.session.user.id },
      include: {
        photos: { orderBy: { order: "asc" }, take: 1 },
        tags: { include: { tag: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(listings);
  }

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category: category as never } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      owner: { select: { id: true, name: true, city: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const publish = body.publish === true;
  const parsed = publish
    ? listingSchema.safeParse(body)
    : listingDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const { geocodeLocation } = await import("@/lib/geocoding");
  const coords = await geocodeLocation(
    "city" in data && data.city ? data.city : "À définir",
    data.neighborhood
  );

  const payload = publish
    ? listingDataFromInput(data as import("@/lib/validations/listing").ListingInput, coords)
    : draftListingDataFromInput(data, coords);

  const photoUrls =
    "photoUrls" in data && Array.isArray(data.photoUrls) ? data.photoUrls : [];

  const listing = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({
      data: {
        ownerId: auth.session.user.id,
        ...payload,
        status: publish ? "ACTIVE" : "DRAFT",
        photos: {
          create: photoUrls.map((url, i) => ({ url, order: i })),
        },
      },
      include: { photos: true, tags: { include: { tag: true } } },
    });

    await syncListingTags(
      tx,
      created.id,
      "tagNames" in data && data.tagNames ? data.tagNames : []
    );
    return created;
  });

  return NextResponse.json(listing, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const source = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  if (
    source.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  const copy = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({
      data: {
        ownerId: auth.session.user.id,
        title: `${source.title} (copie)`,
        description: source.description,
        category: source.category,
        pricePerDay: source.pricePerDay,
        pricePerWeek: source.pricePerWeek,
        weekendPricePerDay: source.weekendPricePerDay,
        condition: source.condition,
        city: source.city,
        neighborhood: source.neighborhood,
        latitude: source.latitude,
        longitude: source.longitude,
        deliveryOption: source.deliveryOption,
        deliveryRadiusKm: source.deliveryRadiusKm,
        deliveryPricingType: source.deliveryPricingType,
        deliveryFlatFee: source.deliveryFlatFee,
        deliveryFeePerKm: source.deliveryFeePerKm,
        deliverySlots: source.deliverySlots,
        cancellationPolicy: source.cancellationPolicy,
        status: "DRAFT",
        photos: {
          create: source.photos.map((p, i) => ({
            url: p.url,
            order: i,
          })),
        },
      },
    });

    if (source.tags.length > 0) {
      await tx.listingTag.createMany({
        data: source.tags.map((t) => ({
          listingId: created.id,
          tagId: t.tagId,
        })),
      });
    }

    return created;
  });

  return NextResponse.json({ id: copy.id }, { status: 201 });
}

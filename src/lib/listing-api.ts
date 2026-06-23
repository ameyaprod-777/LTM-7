import type { Prisma } from "@prisma/client";
import type { AccessTier } from "@/lib/permissions";
import { canViewListingDetails } from "@/lib/permissions";

const listingInclude = {
  photos: { orderBy: { order: "asc" as const } },
  tags: { include: { tag: true } },
  owner: {
    select: {
      id: true,
      name: true,
      image: true,
      city: true,
      bio: true,
      memberSince: true,
      kycVerifiedAt: true,
      identityExpiresAt: true,
    },
  },
  blockedDates: true,
} satisfies Prisma.ListingInclude;

export type ListingWithRelations = Prisma.ListingGetPayload<{
  include: typeof listingInclude;
}>;

export function listingDetailInclude() {
  return listingInclude;
}

export function shapeListingForApi(
  listing: ListingWithRelations,
  tier: AccessTier
) {
  if (canViewListingDetails(tier)) {
    return listing;
  }

  const rest = { ...listing };
  delete (rest as { blockedDates?: unknown }).blockedDates;
  return {
    ...rest,
    owner: {
      id: listing.owner.id,
      name: listing.owner.name,
      image: listing.owner.image,
      city: listing.owner.city,
      memberSince: listing.owner.memberSince,
    },
    restricted: true as const,
  };
}

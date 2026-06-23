import {
  CancellationPolicy,
  ConditionRating,
  DeliveryOption,
  ListingCategory,
  type Listing,
} from "@prisma/client";
import type { ListingDraftInput, ListingInput } from "@/lib/validations/listing";
import { listingSchema } from "@/lib/validations/listing";
import { listingDataFromInput } from "@/lib/listing-payload";
export function draftListingDataFromInput(
  data: ListingDraftInput,
  coords?: { lat: number; lng: number } | null
) {
  const full: ListingInput = {
    title: data.title,
    description:
      data.description?.trim() || "Brouillon — description à compléter.",
    category: data.category ?? ListingCategory.CAMERA,
    pricePerDay: (data.pricePerDay as number | undefined) ?? 10,
    pricePerWeek: data.pricePerWeek,
    weekendPricePerDay: data.weekendPricePerDay,
    condition: data.condition ?? ConditionRating.GOOD,
    city: data.city?.trim() || "À définir",
    neighborhood: data.neighborhood,
    deliveryOption: data.deliveryOption ?? DeliveryOption.PICKUP_ONLY,
    deliveryRadiusKm: data.deliveryRadiusKm,
    deliveryPricingType: data.deliveryPricingType,
    deliveryFlatFee: data.deliveryFlatFee,
    deliveryFeePerKm: data.deliveryFeePerKm,
    deliverySlots: data.deliverySlots ?? [],
    cancellationPolicy:
      data.cancellationPolicy ?? CancellationPolicy.MODERATE,
    photoUrls: data.photoUrls ?? [],
    tagNames: data.tagNames ?? [],
  };

  return listingDataFromInput(full, coords);
}

export function validateListingReadyForPublish(listing: Listing) {
  const euros = {
    pricePerDay: listing.pricePerDay / 100,
    pricePerWeek: listing.pricePerWeek
      ? listing.pricePerWeek / 100
      : undefined,
    weekendPricePerDay: listing.weekendPricePerDay
      ? listing.weekendPricePerDay / 100
      : undefined,
    deliveryFlatFee: listing.deliveryFlatFee
      ? listing.deliveryFlatFee / 100
      : undefined,
  };

  return listingSchema.safeParse({
    title: listing.title,
    description: listing.description,
    category: listing.category,
    pricePerDay: euros.pricePerDay,
    pricePerWeek: euros.pricePerWeek,
    weekendPricePerDay: euros.weekendPricePerDay,
    condition: listing.condition,
    city: listing.city,
    neighborhood: listing.neighborhood ?? undefined,
    deliveryOption: listing.deliveryOption,
    deliveryRadiusKm: listing.deliveryRadiusKm ?? undefined,
    deliveryPricingType: listing.deliveryPricingType,
    deliveryFlatFee: euros.deliveryFlatFee,
    deliveryFeePerKm: listing.deliveryFeePerKm ?? undefined,
    deliverySlots: listing.deliverySlots,
    cancellationPolicy: listing.cancellationPolicy,
    photoUrls: [],
    tagNames: [],
  });
}

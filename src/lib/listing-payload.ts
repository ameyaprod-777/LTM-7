import type { ListingInput } from "@/lib/validations/listing";
import { eurosToCents } from "@/lib/money";
import type { DeliveryOption } from "@prisma/client";

export function listingDataFromInput(
  data: ListingInput,
  coords?: { lat: number; lng: number } | null
) {
  const needsDelivery =
    data.deliveryOption === "DELIVERY_AVAILABLE" ||
    data.deliveryOption === "BOTH";

  return {
    title: data.title,
    description: data.description,
    category: data.category,
    pricePerDay: eurosToCents(data.pricePerDay as number),
    pricePerWeek:
      data.pricePerWeek != null ? eurosToCents(data.pricePerWeek) : null,
    weekendPricePerDay:
      data.weekendPricePerDay != null
        ? eurosToCents(data.weekendPricePerDay)
        : null,
    condition: data.condition,
    city: data.city,
    neighborhood: data.neighborhood || null,
    ...(coords !== undefined
      ? { latitude: coords?.lat ?? null, longitude: coords?.lng ?? null }
      : {}),
    deliveryOption: data.deliveryOption,
    deliveryRadiusKm: needsDelivery ? data.deliveryRadiusKm ?? null : null,
    deliveryPricingType: needsDelivery ? data.deliveryPricingType ?? null : null,
    deliveryFlatFee:
      needsDelivery && data.deliveryFlatFee != null
        ? eurosToCents(data.deliveryFlatFee)
        : null,
    deliveryFeePerKm:
      needsDelivery && data.deliveryFeePerKm != null
        ? data.deliveryFeePerKm
        : null,
    deliverySlots:
      needsDelivery && data.deliverySlots?.length
        ? data.deliverySlots
        : [],
    cancellationPolicy: data.cancellationPolicy,
  };
}

export function deliveryOptionNeedsConfig(option: DeliveryOption) {
  return option === "DELIVERY_AVAILABLE" || option === "BOTH";
}

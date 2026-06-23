import { eachDayOfInterval, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  toDateKey,
  parseDateKey,
  isDateBlocked,
} from "@/lib/listing-availability-shared";

export { toDateKey, parseDateKey, isDateBlocked };

export async function getListingAvailability(listingId: string) {
  const [blockedDates, bookings] = await Promise.all([
    prisma.blockedDate.findMany({
      where: { listingId },
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        listingId,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
      },
      select: { startDate: true, endDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return {
    blocked: blockedDates.map((b) => toDateKey(b.date)),
    booked: bookings.map((b) => ({
      start: toDateKey(b.startDate),
      end: toDateKey(b.endDate),
    })),
  };
}

export async function datesOverlapBlocked(
  listingId: string,
  start: Date,
  end: Date
) {
  const days = eachDayOfInterval({
    start: startOfDay(start),
    end: startOfDay(end),
  });

  const blocked = await prisma.blockedDate.findMany({
    where: {
      listingId,
      date: { in: days },
    },
    take: 1,
  });

  return blocked.length > 0;
}

export async function datesOverlapBooking(
  listingId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string
) {
  const conflict = await prisma.booking.findFirst({
    where: {
      listingId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
      AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
    },
  });
  return !!conflict;
}

export async function isListingUnavailable(
  listingId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string
) {
  if (await datesOverlapBooking(listingId, start, end, excludeBookingId)) {
    return { unavailable: true, reason: "booking" as const };
  }
  if (await datesOverlapBlocked(listingId, start, end)) {
    return { unavailable: true, reason: "blocked" as const };
  }
  return { unavailable: false as const };
}

export function computeDeliveryFee(
  listing: {
    deliveryFlatFee: number | null;
    deliveryFeePerKm: number | null;
    deliveryRadiusKm: number | null;
    deliveryPricingType: string | null;
  },
  pickupOrDelivery: "pickup" | "delivery"
) {
  if (pickupOrDelivery !== "delivery") return 0;

  if (listing.deliveryPricingType === "PER_KM") {
    const perKm = listing.deliveryFeePerKm ?? 0;
    const radius = listing.deliveryRadiusKm ?? 0;
    if (perKm > 0 && radius > 0) {
      return Math.round(perKm * radius * 100);
    }
  }

  return listing.deliveryFlatFee ?? 0;
}

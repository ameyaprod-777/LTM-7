import { differenceInCalendarDays, eachDayOfInterval, isWeekend } from "date-fns";

export function rentalDays(start: Date, end: Date) {
  const days = differenceInCalendarDays(end, start) + 1;
  return Math.max(days, 1);
}

export function computeRentalFee(
  pricePerDay: number,
  pricePerWeek: number | null | undefined,
  days: number,
  options?: {
    start?: Date;
    end?: Date;
    weekendPricePerDay?: number | null;
  }
) {
  if (
    options?.start &&
    options?.end &&
    options.weekendPricePerDay &&
    options.weekendPricePerDay > 0
  ) {
    const intervalDays = eachDayOfInterval({
      start: options.start,
      end: options.end,
    });
    let total = 0;
    for (const day of intervalDays) {
      total += isWeekend(day) ? options.weekendPricePerDay : pricePerDay;
    }
    return total;
  }

  if (pricePerWeek && days >= 7) {
    const weeks = Math.floor(days / 7);
    const remainder = days % 7;
    return weeks * pricePerWeek + remainder * pricePerDay;
  }
  return days * pricePerDay;
}

export function computeBookingTotals({
  rentalFee,
  commissionRate,
  deliveryFee = 0,
}: {
  rentalFee: number;
  commissionRate: number;
  deliveryFee?: number;
}) {
  const commissionFee = Math.round(rentalFee * commissionRate);
  const totalAmount = rentalFee + commissionFee + deliveryFee;
  return { commissionFee, totalAmount };
}

export { isBookingEndDateReached } from "@/lib/booking-dates";

export {
  datesOverlapBooking,
  datesOverlapBlocked,
  isListingUnavailable,
} from "@/lib/listing-availability";

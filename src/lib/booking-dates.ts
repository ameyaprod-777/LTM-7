import { startOfDay } from "date-fns";

/** Jour de fin de location atteint (ou dépassé) — clôture possible. */
export function isBookingEndDateReached(endDate: Date | string): boolean {
  const end = startOfDay(
    typeof endDate === "string" ? new Date(endDate) : endDate
  );
  return startOfDay(new Date()) >= end;
}

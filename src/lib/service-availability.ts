import { eachDayOfInterval, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  toDateKey,
  parseDateKey,
  isDateBlocked,
} from "@/lib/listing-availability-shared";

export { toDateKey, parseDateKey, isDateBlocked };

export async function getServiceAvailability(serviceId: string) {
  const [blockedDates, acceptedQuotes] = await Promise.all([
    prisma.serviceBlockedDate.findMany({
      where: { serviceId },
      orderBy: { date: "asc" },
    }),
    prisma.serviceQuote.findMany({
      where: {
        serviceId,
        status: "ACCEPTED",
        startDate: { not: null },
        endDate: { not: null },
      },
      select: { startDate: true, endDate: true },
    }),
  ]);

  return {
    blocked: blockedDates.map((b) => toDateKey(b.date)),
    booked: acceptedQuotes
      .filter((q) => q.startDate && q.endDate)
      .map((q) => ({
        start: toDateKey(q.startDate!),
        end: toDateKey(q.endDate!),
      })),
  };
}

export async function datesOverlapServiceBlocked(
  serviceId: string,
  start: Date,
  end: Date
) {
  const days = eachDayOfInterval({
    start: startOfDay(start),
    end: startOfDay(end),
  });

  const blocked = await prisma.serviceBlockedDate.findMany({
    where: { serviceId, date: { in: days } },
    take: 1,
  });

  return blocked.length > 0;
}

export async function datesOverlapServiceQuotes(
  serviceId: string,
  start: Date,
  end: Date,
  excludeQuoteId?: string
) {
  const conflict = await prisma.serviceQuote.findFirst({
    where: {
      serviceId,
      id: excludeQuoteId ? { not: excludeQuoteId } : undefined,
      status: { in: ["PENDING", "ACCEPTED"] },
      startDate: { not: null },
      endDate: { not: null },
      AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
    },
  });
  return !!conflict;
}

export async function isServiceUnavailable(
  serviceId: string,
  start: Date,
  end: Date,
  excludeQuoteId?: string
) {
  if (await datesOverlapServiceBlocked(serviceId, start, end)) {
    return { unavailable: true, reason: "blocked" as const };
  }
  if (await datesOverlapServiceQuotes(serviceId, start, end, excludeQuoteId)) {
    return { unavailable: true, reason: "booked" as const };
  }
  return { unavailable: false as const };
}

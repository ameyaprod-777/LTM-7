import { prisma } from "@/lib/prisma";

/** Gains libérés : locations (loueur) + prestations (prestataire). */
export async function getProviderEarningsCents(userId: string) {
  const [listingBookings, servicePayments] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listerId: userId,
        payment: { status: "RELEASED" },
      },
      select: { rentalFee: true, deliveryFee: true },
    }),
    prisma.serviceQuotePayment.aggregate({
      where: {
        status: "RELEASED",
        serviceQuote: { providerId: userId },
      },
      _sum: { providerAmount: true },
    }),
  ]);

  const listingCents = listingBookings.reduce(
    (sum, b) => sum + b.rentalFee + b.deliveryFee,
    0
  );
  const serviceCents = servicePayments._sum.providerAmount ?? 0;

  return {
    totalCents: listingCents + serviceCents,
    listingCents,
    serviceCents,
  };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
export async function GET(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  if (role === "provider") {
    const servicePayments = await prisma.serviceQuotePayment.findMany({
      where: {
        status: { in: ["HELD", "RELEASED"] },
        serviceQuote: { providerId: auth.session.user.id },
      },
      include: {
        serviceQuote: {
          include: {
            service: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      servicePayments.map((p) => ({
        kind: "service" as const,
        quoteId: p.serviceQuoteId,
        serviceTitle: p.serviceQuote.service.title,
        serviceId: p.serviceQuote.service.id,
        amount: p.providerAmount,
        totalAmount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
        releasedAt: p.releasedAt,
      }))
    );
  }

  if (role === "service-client") {
    const servicePayments = await prisma.serviceQuotePayment.findMany({
      where: {
        status: { in: ["PENDING", "HELD", "RELEASED"] },
        serviceQuote: { clientId: auth.session.user.id },
      },
      include: {
        serviceQuote: {
          include: {
            service: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      servicePayments.map((p) => ({
        kind: "service" as const,
        quoteId: p.serviceQuoteId,
        serviceTitle: p.serviceQuote.service.title,
        serviceId: p.serviceQuote.service.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
        releasedAt: p.releasedAt,
      }))
    );
  }

  const bookings = await prisma.booking.findMany({
    where:
      role === "lister"
        ? { listerId: auth.session.user.id }
        : { renterId: auth.session.user.id },
    include: {
      payment: true,
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const transactions = bookings
    .filter((b) => b.payment)
    .map((b) => ({
      kind: "listing" as const,
      bookingId: b.id,
      listingTitle: b.listing.title,
      listingId: b.listing.id,
      role: role === "lister" ? "lister" : "renter",
      amount:
        role === "lister"
          ? b.rentalFee + b.deliveryFee
          : b.payment!.amount,
      refundAmount: b.payment!.refundAmount,
      status: b.payment!.status,
      bookingStatus: b.status,
      createdAt: b.payment!.createdAt,
      releasedAt: b.payment!.releasedAt,
    }));

  return NextResponse.json(transactions);
}

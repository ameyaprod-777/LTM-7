import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { createBookingCheckoutSession } from "@/lib/payment-service";
import { stripeEnabled, paymentsUnavailableMessage } from "@/lib/stripe-config";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: paymentsUnavailableMessage() },
      { status: 503 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { title: true } },
      payment: true,
      conversation: { select: { id: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  if (booking.renterId !== auth.session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (booking.status !== "PENDING" || !booking.listerApprovedAt) {
    return NextResponse.json(
      { error: "En attente de l'approbation du loueur avant paiement." },
      { status: 400 }
    );
  }

  if (booking.payment?.status === "HELD" || booking.payment?.status === "RELEASED") {
    return NextResponse.json({ error: "Déjà payé." }, { status: 400 });
  }

  const startDate = booking.startDate.toISOString().slice(0, 10);
  const endDate = booking.endDate.toISOString().slice(0, 10);

  const checkout = await createBookingCheckoutSession(
    { ...booking, listing: booking.listing },
    booking.conversation?.id ?? "",
    startDate,
    endDate
  );

  if (!checkout) {
    return NextResponse.json(
      { error: paymentsUnavailableMessage() },
      { status: 503 }
    );
  }

  await prisma.payment.update({
    where: { bookingId: booking.id },
    data: { stripePaymentId: checkout.sessionId },
  });

  return NextResponse.json({ checkoutUrl: checkout.url });
}

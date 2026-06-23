import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { createBookingSchema } from "@/lib/validations/booking";
import {
  rentalDays,
  computeRentalFee,
  computeBookingTotals,
  isListingUnavailable,
} from "@/lib/booking-utils";
import { computeDeliveryFee } from "@/lib/listing-availability";
import { createNotification } from "@/lib/notifications";
import {
  allowBookingWithoutStripePayment,
  paymentsUnavailableMessage,
  stripeEnabled,
} from "@/lib/stripe-config";

export async function GET(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const where =
    role === "lister"
      ? { listerId: auth.session.user.id }
      : { renterId: auth.session.user.id };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      listing: { include: { photos: { take: 1 } } },
      renter: { select: { id: true, name: true, image: true } },
      lister: { select: { id: true, name: true, image: true } },
      payment: true,
      deliveries: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  if (!stripeEnabled() && !allowBookingWithoutStripePayment()) {
    return NextResponse.json(
      { error: paymentsUnavailableMessage() },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { listingId, startDate, endDate, pickupOrDelivery, deliveryAddress, deliverySlot } =
    parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId, status: "ACTIVE" },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  if (listing.ownerId === auth.session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas louer votre propre matériel" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
  }

  const unavailable = await isListingUnavailable(listingId, start, end);
  if (unavailable.unavailable) {
    return NextResponse.json(
      {
        error:
          unavailable.reason === "blocked"
            ? "Certaines dates sont bloquées par le loueur"
            : "Ces dates ne sont pas disponibles",
      },
      { status: 409 }
    );
  }

  if (pickupOrDelivery === "delivery" && !deliveryAddress) {
    return NextResponse.json(
      { error: "Adresse de livraison requise" },
      { status: 400 }
    );
  }

  if (
    pickupOrDelivery === "delivery" &&
    listing.deliverySlots.length > 0 &&
    !deliverySlot
  ) {
    return NextResponse.json(
      { error: "Veuillez choisir un créneau de livraison" },
      { status: 400 }
    );
  }

  const days = rentalDays(start, end);
  const rentalFee = computeRentalFee(
    listing.pricePerDay,
    listing.pricePerWeek,
    days,
    {
      start,
      end,
      weekendPricePerDay: listing.weekendPricePerDay,
    }
  );
  const deliveryFee = computeDeliveryFee(listing, pickupOrDelivery);

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  const commissionRate = settings?.commissionRate ?? 0.12;
  const { commissionFee, totalAmount } = computeBookingTotals({
    rentalFee,
    commissionRate,
    deliveryFee,
  });

  const bookingResult = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.create({
      data: {
        listingId,
        renterId: auth.session.user.id,
        listerId: listing.ownerId,
        startDate: start,
        endDate: end,
        status: "PENDING",
        pickupOrDelivery,
        deliveryAddress: deliveryAddress ?? null,
        rentalFee,
        commissionFee,
        deliveryFee,
        totalAmount,
        cancellationPolicy: listing.cancellationPolicy,
      },
    });

    await tx.payment.create({
      data: {
        bookingId: b.id,
        amount: totalAmount,
        status: "PENDING",
      },
    });

    if (pickupOrDelivery === "delivery" && deliveryAddress) {
      await tx.deliveryTask.create({
        data: {
          bookingId: b.id,
          type: "OUTBOUND",
          address: deliveryAddress,
          slot: deliverySlot,
          contactPhone: null,
        },
      });
    }

    const conversation = await tx.conversation.create({
      data: {
        bookingId: b.id,
        participants: {
          create: [
            { userId: auth.session.user.id },
            { userId: listing.ownerId },
          ],
        },
      },
    });

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: auth.session.user.id,
        body: `Bonjour, je souhaite réserver « ${listing.title} » du ${startDate} au ${endDate}.`,
      },
    });

    return { booking: b, conversationId: conversation.id };
  });

  const booking = bookingResult.booking;
  const conversationId = bookingResult.conversationId;

  await createNotification({
    userId: listing.ownerId,
    type: "NEW_BOOKING",
    title: "Nouvelle demande de location",
    body: `${days} jour(s) — ${(totalAmount / 100).toFixed(0)} € · en attente de votre accord`,
    link: `/dashboard/bookings?role=lister`,
  });

  return NextResponse.json(
    {
      booking,
      conversationId,
      checkoutUrl: null,
      message:
        "Demande envoyée. Le loueur doit approuver la réservation avant le paiement.",
    },
    { status: 201 }
  );
}

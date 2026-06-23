import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession, forbidden } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { computeCancellationRefund } from "@/lib/cancellation-policy";
import {
  processBookingRefund,
  releaseBookingFunds,
} from "@/lib/payment-service";
import {
  allowBookingWithoutStripePayment,
  stripeEnabled,
} from "@/lib/stripe-config";
import { patchBookingSchema } from "@/lib/validations/booking";
import { DAMAGE_TYPES } from "@/lib/validations/damage-report";
import { notifyAdminsNewTicket } from "@/lib/ticket-notify";
import { TicketCategory, TicketPriority } from "@prisma/client";
import {
  sendEmail,
  bookingApprovedEmail,
  bookingCancelledEmail,
  sendBookingInvoice,
  areEmailNotificationsEnabled,
  isDeliverableEmail,
} from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patchBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action, reason, damageType, description, estimatedCostEuros } =
    parsed.data;
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      payment: true,
      listing: { select: { title: true } },
      lister: {
        select: {
          email: true,
          name: true,
          stripeAccountId: true,
          stripeChargesEnabled: true,
        },
      },
      renter: { select: { email: true, name: true } },
      conversation: { select: { id: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  const isParty =
    booking.renterId === session.user.id ||
    booking.listerId === session.user.id ||
    session.user.role === "ADMIN";

  if (!isParty) return forbidden();

  if (booking.status === "DISPUTED" && action !== "resolve_dispute") {
    return NextResponse.json(
      { error: "Réservation en litige — fonds gelés jusqu'à résolution." },
      { status: 409 }
    );
  }

  /** B11 : le loueur approuve la demande ; le paiement confirme ensuite (webhook Stripe) */
  if (
    (action === "approve" || action === "confirm") &&
    booking.listerId === session.user.id
  ) {
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette réservation n'est plus en attente d'approbation." },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: { listerApprovedAt: new Date() },
    });

    if (stripeEnabled()) {
      await createNotification({
        userId: booking.renterId,
        type: "BOOKING_CONFIRMED",
        title: "Demande approuvée — procédez au paiement",
        body: booking.listing.title,
        link: `/dashboard/bookings`,
      });

      if (areEmailNotificationsEnabled() && isDeliverableEmail(booking.renter.email)) {
        await sendEmail({
          to: booking.renter.email!,
          subject: `Votre demande a été approuvée — ${booking.listing.title}`,
          html: bookingApprovedEmail(
            booking.renter.name ?? "Locataire",
            booking.listing.title,
            booking.startDate.toLocaleDateString("fr-FR"),
            booking.endDate.toLocaleDateString("fr-FR"),
            (booking.totalAmount / 100).toFixed(0)
          ),
        });
      }

      return NextResponse.json({
        ok: true,
        needsPayment: true,
        payUrl: `/api/bookings/${params.id}/checkout`,
      });
    }

    if (allowBookingWithoutStripePayment()) {
      await prisma.booking.update({
        where: { id: params.id },
        data: { status: "CONFIRMED" },
      });
      if (booking.payment) {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: { status: "HELD" },
        });
      }
      await createNotification({
        userId: booking.renterId,
        type: "BOOKING_CONFIRMED",
        title: "Réservation confirmée (mode dev)",
        link: `/dashboard/bookings`,
      });

      await sendBookingInvoice({
        invoiceNumber: "",
        issuedAt: new Date(),
        booking: {
          id: params.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          listingTitle: booking.listing.title,
          rentalFee: booking.rentalFee,
          deliveryFee: booking.deliveryFee,
          commissionFee: booking.commissionFee,
          totalAmount: booking.totalAmount,
          cancellationPolicy: booking.cancellationPolicy,
        },
        renter: {
          name: booking.renter.name ?? "Locataire",
          email: booking.renter.email ?? "",
          city: null,
        },
        lister: {
          name: booking.lister.name ?? "Loueur",
          email: booking.lister.email ?? "",
          city: null,
        },
        platform: {
          name: process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME ?? "LoueTonMatos",
          email: process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? "contact@louetonmatos.fr",
          address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "France",
          siret: process.env.NEXT_PUBLIC_LEGAL_SIRET ?? null,
        },
      });

      return NextResponse.json({ ok: true, devConfirmed: true });
    }

    return NextResponse.json(
      { error: "Paiements non configurés — impossible de finaliser." },
      { status: 503 }
    );
  }

  if (action === "cancel") {
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette réservation ne peut plus être annulée." },
        { status: 400 }
      );
    }

    const refundCalc = computeCancellationRefund(
      booking.cancellationPolicy,
      booking.totalAmount,
      booking.startDate
    );

    const wasPaid =
      booking.payment &&
      ["HELD", "RELEASED"].includes(booking.payment.status);

    let stripeRefundId: string | null = null;
    if (wasPaid && booking.payment && refundCalc.refundAmount > 0) {
      const result = await processBookingRefund(
        booking.payment,
        refundCalc.refundAmount
      );
      stripeRefundId = result.stripeRefundId;
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        refundAmount: refundCalc.refundAmount,
      },
    });

    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: wasPaid
            ? refundCalc.refundAmount > 0
              ? "REFUNDED"
              : booking.payment.status
            : "PENDING",
          refundAmount: refundCalc.refundAmount,
          stripeRefundId,
        },
      });
    }

    const cancelledByRenter = session.user.id === booking.renterId;
    const otherId = cancelledByRenter ? booking.listerId : booking.renterId;
    const other = cancelledByRenter ? booking.lister : booking.renter;

    await createNotification({
      userId: otherId,
      type: "BOOKING_CANCELLED",
      title: "Réservation annulée",
      body: refundCalc.label,
      link: `/dashboard/bookings`,
    });

    if (areEmailNotificationsEnabled() && isDeliverableEmail(other.email)) {
      await sendEmail({
        to: other.email!,
        subject: `Réservation annulée — ${booking.listing.title}`,
        html: bookingCancelledEmail(
          other.name ?? "Membre",
          booking.listing.title,
          booking.startDate.toLocaleDateString("fr-FR"),
          booking.endDate.toLocaleDateString("fr-FR"),
          refundCalc.label,
          cancelledByRenter
        ),
      });
    }

    return NextResponse.json({
      ok: true,
      cancellation: refundCalc,
    });
  }

  if (action === "complete") {
    if (!["CONFIRMED", "ACTIVE"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Statut incompatible avec la clôture." },
        { status: 400 }
      );
    }

    const listerNet = booking.rentalFee + booking.deliveryFee;

    let stripeTransferId: string | null = null;
    if (booking.payment?.status === "HELD") {
      const release = await releaseBookingFunds(
        booking.payment,
        booking.lister,
        listerNet
      );
      stripeTransferId = release.stripeTransferId;
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          stripeTransferId,
        },
      });
    }

    return NextResponse.json({ ok: true, canReview: true });
  }

  if (action === "dispute") {
    if (!["CONFIRMED", "ACTIVE"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Litige possible uniquement sur une réservation confirmée." },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "DISPUTED",
        disputedAt: new Date(),
        disputeReason: typeof reason === "string" ? reason.slice(0, 2000) : null,
      },
    });

    const otherId =
      session.user.id === booking.renterId
        ? booking.listerId
        : booking.renterId;

    await createNotification({
      userId: otherId,
      type: "BOOKING_CANCELLED",
      title: "Litige ouvert sur une réservation",
      link: `/dashboard/bookings`,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "report_damage") {
    if (!["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status)) {
      return NextResponse.json(
        {
          error:
            "Signalement possible sur une réservation confirmée, en cours ou terminée.",
        },
        { status: 400 }
      );
    }

    const typeLabel = damageType
      ? DAMAGE_TYPES[damageType]
      : "Non précisé";
    const costLine =
      estimatedCostEuros != null
        ? `\nCoût estimé : ${estimatedCostEuros.toFixed(2)} €`
        : "";
    const disputeText = `[Sinistre — ${typeLabel}]\n${description?.trim()}${costLine}`;
    const ticketBody = `Réservation : ${booking.listing.title} (${params.id})\n\n${disputeText}`;

    const ticket = await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: params.id },
        data: {
          status: "DISPUTED",
          disputedAt: new Date(),
          disputeReason: disputeText.slice(0, 2000),
        },
      });

      return tx.supportTicket.create({
        data: {
          userId: session.user.id,
          subject: `Sinistre matériel — ${booking.listing.title}`,
          category: TicketCategory.BOOKING_DISPUTE,
          priority: TicketPriority.HIGH,
          bookingId: params.id,
          messages: {
            create: {
              body: ticketBody,
              authorId: session.user.id,
            },
          },
        },
      });
    });

    const otherId =
      session.user.id === booking.renterId
        ? booking.listerId
        : booking.renterId;

    await createNotification({
      userId: otherId,
      type: "TICKET_NEW",
      title: "Sinistre déclaré sur une réservation",
      body: booking.listing.title,
      link: `/dashboard/support/${ticket.id}`,
    });

    await notifyAdminsNewTicket({
      id: ticket.id,
      subject: ticket.subject,
    });

    return NextResponse.json({ ok: true, ticketId: ticket.id });
  }

  if (action === "resolve_dispute" && session.user.role === "ADMIN") {
    await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CONFIRMED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "activate" && session.user.role === "ADMIN") {
    await prisma.booking.update({
      where: { id: params.id },
      data: { status: "ACTIVE" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}

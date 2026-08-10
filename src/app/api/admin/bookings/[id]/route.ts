import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffApi } from "@/lib/api-auth";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { releaseBookingFunds } from "@/lib/payment-service";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const { action } = await req.json();
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      payment: true,
      lister: {
        select: {
          stripeAccountId: true,
          stripeChargesEnabled: true,
          stripePayoutsEnabled: true,
          payoutMethod: true,
          ibanEncrypted: true,
          ibanLast4: true,
          ibanHolderName: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  if (action === "activate") {
    await prisma.booking.update({
      where: { id: params.id },
      data: { status: "ACTIVE" },
    });
  } else if (action === "resolve_dispute") {
    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "CONFIRMED",
        disputedAt: null,
        disputeReason: null,
        renterCompletedAt: null,
      },
    });
  } else if (action === "complete") {
    if (!["CONFIRMED", "ACTIVE"].includes(booking.status)) {
      return NextResponse.json({ error: "Statut incompatible" }, { status: 400 });
    }
    const listerNet = booking.rentalFee + booking.deliveryFee;
    let stripeTransferId: string | null = null;
    let manualPayoutPending = false;
    if (booking.payment?.status === "HELD") {
      const release = await releaseBookingFunds(
        booking.payment,
        booking.lister,
        listerNet
      );
      stripeTransferId = release.stripeTransferId;
      manualPayoutPending = release.manualPayoutPending;
    }
    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        renterCompletedAt: booking.renterCompletedAt ?? new Date(),
      },
    });
    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
          stripeTransferId,
          ...(manualPayoutPending
            ? { manualPayoutStatus: "PENDING" as const }
            : {}),
        },
      });
    }
  } else if (action === "cancel") {
    await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  } else {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  void logAudit({
    adminId: auth.session.user.id,
    action: `booking.${action}`,
    targetType: "Booking",
    targetId: params.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}

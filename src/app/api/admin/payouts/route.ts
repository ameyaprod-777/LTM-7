import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffApi } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { decryptIban, formatIbanGrouped, maskIban } from "@/lib/iban";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const payments = await prisma.payment.findMany({
    where: {
      manualPayoutStatus: status === "PAID" ? "PAID" : "PENDING",
      status: "RELEASED",
    },
    include: {
      booking: {
        select: {
          id: true,
          rentalFee: true,
          deliveryFee: true,
          commissionFee: true,
          totalAmount: true,
          completedAt: true,
          listing: { select: { id: true, title: true } },
          lister: {
            select: {
              id: true,
              name: true,
              email: true,
              ibanEncrypted: true,
              ibanLast4: true,
              ibanHolderName: true,
            },
          },
        },
      },
    },
    orderBy: { releasedAt: "asc" },
    take: 100,
  });

  return NextResponse.json(
    payments.map((p) => {
      const listerNet = p.booking.rentalFee + p.booking.deliveryFee;
      let ibanFull: string | null = null;
      try {
        if (p.booking.lister.ibanEncrypted) {
          ibanFull = formatIbanGrouped(
            decryptIban(p.booking.lister.ibanEncrypted)
          );
        }
      } catch {
        ibanFull = null;
      }

      return {
        paymentId: p.id,
        bookingId: p.booking.id,
        listingTitle: p.booking.listing.title,
        listingId: p.booking.listing.id,
        amountCents: listerNet,
        commissionCents: p.booking.commissionFee,
        totalPaidCents: p.booking.totalAmount,
        completedAt: p.booking.completedAt,
        releasedAt: p.releasedAt,
        manualPayoutStatus: p.manualPayoutStatus,
        manualPayoutPaidAt: p.manualPayoutPaidAt,
        manualPayoutNote: p.manualPayoutNote,
        lister: {
          id: p.booking.lister.id,
          name: p.booking.lister.name,
          email: p.booking.lister.email,
          holderName: p.booking.lister.ibanHolderName,
          ibanMasked: maskIban(p.booking.lister.ibanLast4),
          ibanFull,
        },
      };
    })
  );
}

const patchSchema = z.object({
  paymentId: z.string().min(1),
  note: z.string().max(500).optional(),
});

/** Marque un virement SEPA comme effectué. */
export async function PATCH(req: Request) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data.paymentId },
    include: {
      booking: {
        select: {
          id: true,
          listerId: true,
          rentalFee: true,
          deliveryFee: true,
          listing: { select: { title: true } },
        },
      },
    },
  });

  if (!payment || payment.manualPayoutStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Virement introuvable ou déjà traité." },
      { status: 404 }
    );
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      manualPayoutStatus: "PAID",
      manualPayoutPaidAt: new Date(),
      manualPayoutPaidById: auth.session.user.id,
      manualPayoutNote: parsed.data.note?.trim() || null,
    },
  });

  const net = payment.booking.rentalFee + payment.booking.deliveryFee;

  await createNotification({
    userId: payment.booking.listerId,
    type: "BOOKING_CONFIRMED",
    title: "Virement effectué",
    body: `${(net / 100).toFixed(2)} € versés pour « ${payment.booking.listing.title} »`,
    link: "/dashboard/payments",
  });

  void logAudit({
    adminId: auth.session.user.id,
    action: "payout.manual_paid",
    targetType: "Payment",
    targetId: payment.id,
    metadata: { bookingId: payment.booking.id, amountCents: net },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import {
  canProviderSettleQuote,
  settleTimingLabel,
} from "@/lib/service-quote-payment";
import { SERVICE_PAYMENT_TIMING_LABELS } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const quote = await prisma.serviceQuote.findUnique({
    where: { id: params.id },
    include: {
      service: { select: { title: true } },
      payment: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  if (quote.providerId !== auth.session.user.id) {
    return forbidden();
  }

  if (!quote.agreedPaymentTiming) {
    return NextResponse.json({ error: "Modalité de paiement manquante." }, { status: 400 });
  }

  if (
    !canProviderSettleQuote({
      status: quote.status,
      agreedPaymentTiming: quote.agreedPaymentTiming,
      startDate: quote.startDate,
      endDate: quote.endDate,
      payment: quote.payment,
    })
  ) {
    const timing = quote.agreedPaymentTiming;
    const hint =
      timing === "AFTER_SERVICE"
        ? "Attendez la fin de la prestation et assurez-vous que le client a payé (en ligne ou espèces déclarées)."
        : "Le client doit d'abord payer en ligne ou déclarer un paiement en espèces.";
    return NextResponse.json({ error: hint }, { status: 400 });
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.serviceQuotePayment.update({
      where: { serviceQuoteId: quote.id },
      data: {
        status: "RELEASED",
        settledAt: now,
        releasedAt: now,
        ...(quote.payment?.method === "CASH" && !quote.payment.paidAt
          ? { paidAt: now }
          : {}),
      },
    });

    return tx.serviceQuote.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
      },
      include: { payment: true },
    });
  });

  const timingLabel = settleTimingLabel(quote.agreedPaymentTiming);

  if (quote.conversationId) {
    await prisma.message.create({
      data: {
        conversationId: quote.conversationId,
        senderId: auth.session.user.id,
        body: `Prestation clôturée — règlement confirmé ${timingLabel}.`,
      },
    });
    await prisma.conversation.update({
      where: { id: quote.conversationId },
      data: { updatedAt: new Date() },
    });
  }

  await createNotification({
    userId: quote.clientId,
    type: "BOOKING_CONFIRMED",
    title: "Prestation terminée",
    body: `« ${quote.service.title} » — ${SERVICE_PAYMENT_TIMING_LABELS[quote.agreedPaymentTiming]}`,
    link: quote.conversationId
      ? `/dashboard/messages/${quote.conversationId}`
      : `/dashboard/bookings?role=services&as=client`,
  });

  return NextResponse.json(updated);
}

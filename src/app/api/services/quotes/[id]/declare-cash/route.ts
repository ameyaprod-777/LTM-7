import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import {
  computeServiceQuoteTotals,
  canDeclareCashPayment,
  resolveQuoteAmountCents,
} from "@/lib/service-quote-payment";
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
      service: { select: { title: true, priceAmount: true } },
      payment: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  if (quote.clientId !== auth.session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const amountCents = resolveQuoteAmountCents(
    quote.proposedAmount,
    quote.service.priceAmount
  );

  if (
    !canDeclareCashPayment({
      status: quote.status,
      amountCents,
      payment: quote.payment,
    })
  ) {
    return NextResponse.json(
      { error: "Paiement en espèces non disponible pour ce devis." },
      { status: 400 }
    );
  }

  const settings = await prisma.platformSettings.findFirst();
  const commissionRate = settings?.commissionRate ?? 0.12;

  if (!quote.payment && amountCents) {
    const totals = computeServiceQuoteTotals(amountCents, commissionRate);
    await prisma.serviceQuotePayment.create({
      data: {
        serviceQuoteId: quote.id,
        ...totals,
        method: "CASH",
        clientDeclaredCashAt: new Date(),
        status: "PENDING",
      },
    });
  } else {
    await prisma.serviceQuotePayment.update({
      where: { serviceQuoteId: quote.id },
      data: {
        method: "CASH",
        clientDeclaredCashAt: new Date(),
      },
    });
  }

  if (quote.conversationId) {
    await prisma.message.create({
      data: {
        conversationId: quote.conversationId,
        senderId: auth.session.user.id,
        body: "Le client indique qu'il réglera en espèces.",
      },
    });
    await prisma.conversation.update({
      where: { id: quote.conversationId },
      data: { updatedAt: new Date() },
    });
  }

  await createNotification({
    userId: quote.providerId,
    type: "NEW_MESSAGE",
    title: "Paiement en espèces",
    body: `« ${quote.service.title} » — le client paiera en espèces.`,
    link: `/dashboard/bookings?role=services&as=provider`,
  });

  return NextResponse.json({ ok: true });
}

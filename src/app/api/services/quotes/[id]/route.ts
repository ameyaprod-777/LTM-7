import { NextResponse } from "next/server";
import { ServicePaymentTiming } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import { serviceQuoteActionSchema } from "@/lib/validations/service-quote";
import { isServiceUnavailable } from "@/lib/service-availability";
import { createNotification } from "@/lib/notifications";
import {
  computeServiceQuoteTotals,
  resolveQuoteAmountCents,
} from "@/lib/service-quote-payment";
import { SERVICE_PAYMENT_TIMING_LABELS } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const quote = await prisma.serviceQuote.findUnique({
    where: { id: params.id },
    include: {
      service: { select: { title: true, priceAmount: true } },
      client: { select: { name: true } },
      payment: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  if (quote.providerId !== auth.session.user.id) {
    return forbidden();
  }

  if (quote.status !== "PENDING") {
    return NextResponse.json(
      { error: "Ce devis a déjà été traité." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = serviceQuoteActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const { action, message, acceptAfterPayment } = parsed.data;

  if (action === "reject") {
    const updated = await prisma.serviceQuote.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        providerMessage: message?.trim() || null,
      },
    });

    await appendProviderMessage(quote.conversationId, auth.session.user.id, message);

    const rejectBody =
      quote.clientPaymentPreference === "AFTER_SERVICE"
        ? `« ${quote.service.title} » — le prestataire n'accepte pas le paiement après prestation.`
        : `« ${quote.service.title} »`;

    await createNotification({
      userId: quote.clientId,
      type: "NEW_MESSAGE",
      title: "Devis refusé",
      body: rejectBody,
      link: quote.conversationId
        ? `/dashboard/messages/${quote.conversationId}`
        : `/services/${quote.serviceId}`,
    });

    return NextResponse.json(updated);
  }

  // Accept
  if (
    quote.clientPaymentPreference === ServicePaymentTiming.AFTER_SERVICE &&
    !acceptAfterPayment
  ) {
    return NextResponse.json(
      {
        error:
          "Confirmez que vous acceptez un paiement après la prestation, ou refusez la demande.",
      },
      { status: 400 }
    );
  }

  if (quote.startDate && quote.endDate) {
    const unavailable = await isServiceUnavailable(
      quote.serviceId,
      quote.startDate,
      quote.endDate,
      quote.id
    );
    if (unavailable.unavailable) {
      return NextResponse.json(
        { error: "Les dates ne sont plus disponibles." },
        { status: 409 }
      );
    }
  }

  const agreedTiming =
    quote.clientPaymentPreference === ServicePaymentTiming.AFTER_SERVICE
      ? ServicePaymentTiming.AFTER_SERVICE
      : ServicePaymentTiming.UPFRONT;

  const settings = await prisma.platformSettings.findFirst();
  const commissionRate = settings?.commissionRate ?? 0.12;

  let paymentCreate:
    | {
        amount: number;
        providerAmount: number;
        commissionFee: number;
      }
    | undefined;

  const amountCents = resolveQuoteAmountCents(
    quote.proposedAmount,
    quote.service.priceAmount
  );
  if (amountCents) {
    paymentCreate = computeServiceQuoteTotals(amountCents, commissionRate);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const q = await tx.serviceQuote.update({
      where: { id: params.id },
      data: {
        status: "ACCEPTED",
        agreedPaymentTiming: agreedTiming,
        providerMessage: message?.trim() || null,
        ...(paymentCreate
          ? {
              payment: {
                create: {
                  ...paymentCreate,
                  status: "PENDING",
                },
              },
            }
          : {}),
      },
      include: { payment: true },
    });
    return q;
  });

  const paymentNote =
    agreedTiming === ServicePaymentTiming.UPFRONT
      ? " Le client peut procéder au paiement en ligne."
      : " Paiement convenu après la prestation.";

  if (quote.conversationId) {
    const autoMsg = [
      `Devis accepté — ${SERVICE_PAYMENT_TIMING_LABELS[agreedTiming]}.${paymentNote}`,
      message?.trim() ? `\n\n${message.trim()}` : "",
    ].join("");
    await prisma.message.create({
      data: {
        conversationId: quote.conversationId,
        senderId: auth.session.user.id,
        body: autoMsg,
      },
    });
    await prisma.conversation.update({
      where: { id: quote.conversationId },
      data: { updatedAt: new Date() },
    });
  }

  await createNotification({
    userId: quote.clientId,
    type: "NEW_MESSAGE",
    title: "Devis accepté",
    body: `« ${quote.service.title} » — ${SERVICE_PAYMENT_TIMING_LABELS[agreedTiming]}`,
    link: quote.conversationId
      ? `/dashboard/messages/${quote.conversationId}`
      : `/dashboard/bookings?role=services&as=client`,
  });

  return NextResponse.json(updated);
}

async function appendProviderMessage(
  conversationId: string | null,
  senderId: string,
  message?: string
) {
  if (!conversationId || !message?.trim()) return;
  await prisma.message.create({
    data: { conversationId, senderId, body: message.trim() },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

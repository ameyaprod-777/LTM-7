import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { createServiceQuoteCheckoutSession } from "@/lib/payment-service";
import {
  computeServiceQuoteTotals,
  resolveQuoteAmountCents,
} from "@/lib/service-quote-payment";
import { stripeEnabled, paymentsUnavailableMessage } from "@/lib/stripe-config";
import { toDateKey } from "@/lib/listing-availability-shared";

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

  if (quote.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Le devis doit être accepté avant paiement." },
      { status: 400 }
    );
  }

  const amountCents = resolveQuoteAmountCents(
    quote.proposedAmount,
    quote.service.priceAmount
  );
  if (!amountCents) {
    return NextResponse.json(
      { error: "Montant du devis non défini." },
      { status: 400 }
    );
  }

  if (quote.payment?.status === "HELD" || quote.payment?.status === "RELEASED") {
    return NextResponse.json({ error: "Déjà payé." }, { status: 400 });
  }

  const settings = await prisma.platformSettings.findFirst();
  const commissionRate = settings?.commissionRate ?? 0.12;
  const totals = computeServiceQuoteTotals(amountCents, commissionRate);

  if (!quote.payment) {
    await prisma.serviceQuotePayment.create({
      data: {
        serviceQuoteId: quote.id,
        amount: totals.amount,
        providerAmount: totals.providerAmount,
        commissionFee: totals.commissionFee,
        method: "STRIPE",
        status: "PENDING",
      },
    });
  }

  const checkout = await createServiceQuoteCheckoutSession(
    {
      id: quote.id,
      proposedAmount: amountCents,
      service: quote.service,
      conversationId: quote.conversationId,
    },
    totals.amount,
    quote.startDate ? toDateKey(quote.startDate) : null,
    quote.endDate ? toDateKey(quote.endDate) : null
  );

  if (!checkout) {
    return NextResponse.json(
      { error: paymentsUnavailableMessage() },
      { status: 503 }
    );
  }

  await prisma.serviceQuotePayment.update({
    where: { serviceQuoteId: quote.id },
    data: {
      stripePaymentId: checkout.sessionId,
      method: "STRIPE",
    },
  });

  return NextResponse.json({ checkoutUrl: checkout.url });
}

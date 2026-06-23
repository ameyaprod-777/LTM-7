import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const body = await req.text();
  const sig = headers().get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const serviceQuoteId = session.metadata?.serviceQuoteId;
      if (serviceQuoteId) {
        await prisma.serviceQuotePayment.updateMany({
          where: { serviceQuoteId },
          data: {
            status: "HELD",
            method: "STRIPE",
            paidAt: new Date(),
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : undefined,
          },
        });
        const quote = await prisma.serviceQuote.findUnique({
          where: { id: serviceQuoteId },
          include: { service: { select: { title: true } } },
        });
        if (quote) {
          await createNotification({
            userId: quote.providerId,
            type: "PAYMENT_RECEIVED",
            title: "Paiement reçu (prestation)",
            body: `« ${quote.service.title} »`,
            link: `/dashboard/bookings?role=services&as=provider`,
          });
          await createNotification({
            userId: quote.clientId,
            type: "BOOKING_CONFIRMED",
            title: "Paiement confirmé",
            body: `« ${quote.service.title} »`,
            link: quote.conversationId
              ? `/dashboard/messages/${quote.conversationId}`
              : `/dashboard/bookings?role=services&as=client`,
          });
        }
      }

      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });
        await prisma.payment.updateMany({
          where: { bookingId },
          data: {
            status: "HELD",
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : undefined,
          },
        });
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });
        if (booking) {
          await createNotification({
            userId: booking.listerId,
            type: "PAYMENT_RECEIVED",
            title: "Paiement reçu",
            link: `/dashboard/bookings?role=lister`,
          });
          await createNotification({
            userId: booking.renterId,
            type: "BOOKING_CONFIRMED",
            title: "Paiement confirmé",
            link: `/dashboard/bookings`,
          });
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: intent.id },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            failureReason:
              intent.last_payment_error?.message ?? "Paiement refusé",
          },
        });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : null;
      if (paymentIntentId) {
        await prisma.payment.updateMany({
          where: { stripePaymentId: paymentIntentId },
          data: {
            status: "REFUNDED",
            refundAmount: charge.amount_refunded,
            stripeRefundId: charge.refunds?.data[0]?.id ?? null,
          },
        });
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      await prisma.user.updateMany({
        where: { stripeAccountId: account.id },
        data: {
          stripeChargesEnabled: account.charges_enabled ?? false,
          stripePayoutsEnabled: account.payouts_enabled ?? false,
        },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

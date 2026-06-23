import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import { createServiceQuoteSchema } from "@/lib/validations/service-quote";
import { formatApiError, zodFieldErrors } from "@/lib/zod-errors";
import { createNewServiceConversation } from "@/lib/conversations";
import {
  parseDateKey,
  isServiceUnavailable,
} from "@/lib/service-availability";
import { createNotification } from "@/lib/notifications";
import { eurosToCents } from "@/lib/money";
import { SERVICE_PAYMENT_TIMING_LABELS } from "@/lib/constants";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const service = await prisma.service.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });

  if (!service || service.ownerId !== auth.session.user.id) {
    return forbidden();
  }

  const quotes = await prisma.serviceQuote.findMany({
    where: { serviceId: params.id },
    include: {
      client: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(quotes);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const service = await prisma.service.findFirst({
    where: { id: params.id, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      ownerId: true,
      rateType: true,
      priceAmount: true,
    },
  });

  if (!service) {
    return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
  }

  if (service.ownerId === auth.session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas demander un devis sur votre propre service." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = createServiceQuoteSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = zodFieldErrors(parsed.error);
    return NextResponse.json(
      { error: formatApiError(fieldErrors), fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (service.rateType !== "PROJECT") {
    if (!data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: "Les dates de prestation sont requises." },
        { status: 400 }
      );
    }
    startDate = parseDateKey(data.startDate);
    endDate = parseDateKey(data.endDate);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début." },
        { status: 400 }
      );
    }
  } else if (data.startDate && data.endDate) {
    startDate = parseDateKey(data.startDate);
    endDate = parseDateKey(data.endDate);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début." },
        { status: 400 }
      );
    }
  }

  let proposedAmount: number | null = null;
  if (data.proposedAmount != null) {
    proposedAmount = eurosToCents(data.proposedAmount);
  } else if (service.rateType === "DAILY" && startDate && endDate) {
    const days = differenceInCalendarDays(endDate, startDate) + 1;
    proposedAmount = service.priceAmount * Math.max(1, days);
  } else if (service.rateType === "HOURLY") {
    proposedAmount = service.priceAmount;
  } else if (service.rateType === "PROJECT") {
    proposedAmount = service.priceAmount;
  }

  const pendingQuote = await prisma.serviceQuote.findFirst({
    where: {
      serviceId: params.id,
      clientId: auth.session.user.id,
      status: "PENDING",
    },
    select: { id: true, conversationId: true },
  });

  if (service.rateType !== "PROJECT" && startDate && endDate) {
    const unavailable = await isServiceUnavailable(
      params.id,
      startDate,
      endDate,
      pendingQuote?.id
    );
    if (unavailable.unavailable) {
      return NextResponse.json(
        {
          error:
            unavailable.reason === "blocked"
              ? "Certaines dates sont indisponibles."
              : "Ces dates sont déjà réservées ou en attente.",
        },
        { status: 409 }
      );
    }
  }

  const briefSummary = [
    data.brief,
    startDate && endDate
      ? `\n\nPériode : ${data.startDate} → ${data.endDate}`
      : "",
    proposedAmount != null
      ? `\nBudget indicatif : ${(proposedAmount / 100).toFixed(2)} €`
      : "",
    `\n\nMode de paiement souhaité : ${SERVICE_PAYMENT_TIMING_LABELS[data.paymentPreference]}`,
    "\n\nPérimètre accepté :",
    data.scopeImageRights ? "✓ Droits image" : "✗ Droits image",
    data.scopeScheduleAgreed ? "✓ Horaires convenus" : "✗ Horaires",
    data.scopeDeliverablesAgreed ? "✓ Livrables définis" : "✗ Livrables",
  ].join("");

  try {
    const quoteData = {
      startDate,
      endDate,
      brief: data.brief,
      proposedAmount,
      scopeImageRights: data.scopeImageRights,
      scopeScheduleAgreed: data.scopeScheduleAgreed,
      scopeDeliverablesAgreed: data.scopeDeliverablesAgreed,
      acceptServiceTerms: data.acceptServiceTerms,
      clientPaymentPreference: data.paymentPreference,
    };

    let conversationId: string;
    let quote;
    let isNew = false;

    if (pendingQuote?.conversationId) {
      conversationId = pendingQuote.conversationId;
      await prisma.message.create({
        data: {
          conversationId,
          senderId: auth.session.user.id,
          body: briefSummary,
        },
      });
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      quote = await prisma.serviceQuote.update({
        where: { id: pendingQuote.id },
        data: { ...quoteData, conversationId },
      });
    } else {
      const conversation = await createNewServiceConversation(
        auth.session.user.id,
        params.id,
        briefSummary
      );
      conversationId = conversation.id;
      quote = await prisma.serviceQuote.create({
        data: {
          serviceId: params.id,
          clientId: auth.session.user.id,
          providerId: service.ownerId,
          conversationId,
          ...quoteData,
        },
      });
      isNew = true;
    }

    if (isNew) {
      const client = await prisma.user.findUnique({
        where: { id: auth.session.user.id },
        select: { name: true },
      });

      await createNotification({
        userId: service.ownerId,
        type: "NEW_MESSAGE",
        title: "Nouvelle demande de devis",
        body: `${client?.name ?? "Un membre"} — « ${service.title} »`,
        link: `/dashboard/bookings?role=services&as=provider`,
      });
    }

    return NextResponse.json(
      { quoteId: quote.id, conversationId },
      { status: isNew ? 201 : 200 }
    );
  } catch (err) {
    console.error("[service-quotes]", err);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la demande de devis." },
      { status: 500 }
    );
  }
}

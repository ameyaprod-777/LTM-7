import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SERVICE_QUOTE_STATUS_LABELS,
  SERVICE_PAYMENT_TIMING_LABELS,
} from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { toDateKey } from "@/lib/listing-availability-shared";
import { BookingActions } from "@/components/bookings/booking-actions";
import { ServiceQuoteActions } from "@/components/bookings/service-quote-actions";
import { ServiceQuotePaymentPanel } from "@/components/services/service-quote-payment-panel";
import { ReviewForm } from "@/components/reviews/review-form";
import { MessageSquare, Briefcase } from "lucide-react";
import type { ServiceQuoteStatus } from "@prisma/client";

export const metadata = { title: "Réservations" };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { role?: string; as?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const view = searchParams.role === "lister"
    ? "lister"
    : searchParams.role === "services"
      ? "services"
      : "renter";

  const asProvider = searchParams.as !== "client";
  const stripePaymentsEnabled = !!process.env.STRIPE_SECRET_KEY;

  const bookings =
    view === "services"
      ? []
      : await prisma.booking.findMany({
          where:
            view === "lister"
              ? { listerId: session.user.id }
              : { renterId: session.user.id },
          include: {
            listing: { select: { title: true, id: true } },
            renter: { select: { name: true } },
            lister: { select: { name: true } },
            reviews: { where: { authorId: session.user.id } },
            conversation: { select: { id: true } },
            payment: true,
          },
          orderBy: { createdAt: "desc" },
        });

  const serviceQuotes =
    view === "services"
      ? await prisma.serviceQuote.findMany({
          where: asProvider
            ? { providerId: session.user.id }
            : { clientId: session.user.id },
          include: {
            service: { select: { id: true, title: true, priceAmount: true } },
            client: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
            payment: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const pendingQuotesCount =
    view === "services" && asProvider
      ? serviceQuotes.filter((q) => q.status === "PENDING").length
      : 0;

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm ${active ? "bg-accent text-white" : "bg-anthracite-100"}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Réservations</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Locations de matériel et demandes de devis pour vos prestations.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/bookings" className={tabClass(view === "renter")}>
          Locations · locataire
        </Link>
        <Link
          href="/dashboard/bookings?role=lister"
          className={tabClass(view === "lister")}
        >
          Locations · loueur
        </Link>
        <Link
          href="/dashboard/bookings?role=services&as=provider"
          className={tabClass(view === "services")}
        >
          Prestations
          {pendingQuotesCount > 0 && (
            <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs">
              {pendingQuotesCount}
            </span>
          )}
        </Link>
      </div>

      {view === "services" && (
        <div className="mt-3 flex gap-2">
          <Link
            href="/dashboard/bookings?role=services&as=provider"
            className={tabClass(asProvider)}
          >
            En tant que prestataire
          </Link>
        <Link
          href="/dashboard/bookings?role=services&as=client"
          className={tabClass(!asProvider)}
        >
          Mes demandes (régler ici)
        </Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {view === "services" ? (
          serviceQuotes.length === 0 ? (
            <p className="text-anthracite-500">
              {asProvider
                ? "Aucune demande de devis pour vos services."
                : "Vous n'avez pas encore demandé de devis."}
            </p>
          ) : (
            serviceQuotes.map((q) => {
              const status = q.status as ServiceQuoteStatus;
              const counterpart = asProvider ? q.client : q.provider;
              return (
                <article
                  key={q.id}
                  className="rounded-xl border border-anthracite-100 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 shrink-0 text-accent" />
                        <Link
                          href={`/services/${q.service.id}`}
                          className="font-semibold text-anthracite hover:text-accent"
                        >
                          {q.service.title}
                        </Link>
                      </div>
                      <p className="mt-1 text-sm text-anthracite-500">
                        {SERVICE_QUOTE_STATUS_LABELS[status]}
                        {q.startDate && q.endDate && (
                          <>
                            {" "}
                            · {formatDate(q.startDate)} → {formatDate(q.endDate)}
                          </>
                        )}
                      </p>
                      <p className="text-sm text-anthracite-400">
                        {asProvider ? "Client" : "Prestataire"} :{" "}
                        {counterpart.name ?? "Membre"}
                      </p>
                      {q.proposedAmount != null && (
                        <p className="mt-1 font-medium text-accent">
                          {formatCents(q.proposedAmount)}
                        </p>
                      )}
                      <p className="text-xs text-anthracite-500">
                        {q.status === "ACCEPTED" && q.agreedPaymentTiming
                          ? `Paiement : ${SERVICE_PAYMENT_TIMING_LABELS[q.agreedPaymentTiming]}`
                          : `Souhaité : ${SERVICE_PAYMENT_TIMING_LABELS[q.clientPaymentPreference]}`}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm text-anthracite-600">
                        {q.brief}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {q.conversationId && (
                        <Link
                          href={`/dashboard/messages/${q.conversationId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-anthracite-200 px-3 py-2 text-sm font-medium text-anthracite-600 hover:border-accent hover:text-accent"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Messages
                        </Link>
                      )}
                      {asProvider && (
                        <ServiceQuoteActions
                          quoteId={q.id}
                          status={q.status}
                          role="provider"
                          clientPaymentPreference={q.clientPaymentPreference}
                          agreedPaymentTiming={q.agreedPaymentTiming}
                          proposedAmount={q.proposedAmount}
                          servicePriceAmount={q.service.priceAmount}
                          serviceTitle={q.service.title}
                          payment={
                            q.payment
                              ? {
                                  status: q.payment.status,
                                  method: q.payment.method,
                                  clientDeclaredCashAt:
                                    q.payment.clientDeclaredCashAt?.toISOString() ??
                                    null,
                                }
                              : null
                          }
                          endDate={q.endDate ? toDateKey(q.endDate) : null}
                          stripePaymentsEnabled={stripePaymentsEnabled}
                        />
                      )}
                    </div>
                  </div>
                  {!asProvider && status === "ACCEPTED" && (
                    <div className="mt-4 border-t border-anthracite-100 pt-4">
                      <ServiceQuotePaymentPanel
                        quoteId={q.id}
                        status={q.status}
                        serviceTitle={q.service.title}
                        proposedAmount={q.proposedAmount}
                        servicePriceAmount={q.service.priceAmount}
                        agreedPaymentTiming={q.agreedPaymentTiming}
                        payment={
                          q.payment
                            ? {
                                status: q.payment.status,
                                method: q.payment.method,
                                clientDeclaredCashAt:
                                  q.payment.clientDeclaredCashAt?.toISOString() ??
                                  null,
                              }
                            : null
                        }
                        stripePaymentsEnabled={stripePaymentsEnabled}
                      />
                    </div>
                  )}
                  {!asProvider && status !== "ACCEPTED" && (
                    <div className="mt-4 border-t border-anthracite-100 pt-4">
                      <ServiceQuoteActions
                        quoteId={q.id}
                        status={q.status}
                        role="client"
                        clientPaymentPreference={q.clientPaymentPreference}
                        agreedPaymentTiming={q.agreedPaymentTiming}
                        proposedAmount={q.proposedAmount}
                        servicePriceAmount={q.service.priceAmount}
                        serviceTitle={q.service.title}
                        payment={
                          q.payment
                            ? {
                                status: q.payment.status,
                                method: q.payment.method,
                                clientDeclaredCashAt:
                                  q.payment.clientDeclaredCashAt?.toISOString() ??
                                  null,
                              }
                            : null
                        }
                        stripePaymentsEnabled={stripePaymentsEnabled}
                      />
                    </div>
                  )}
                </article>
              );
            })
          )
        ) : bookings.length === 0 ? (
          <p className="text-anthracite-500">Aucune réservation.</p>
        ) : (
          bookings.map((b) => {
            const awaitingListerConfirm =
              view === "lister" &&
              ["CONFIRMED", "ACTIVE"].includes(b.status) &&
              !!b.renterCompletedAt;

            return (
            <article
              key={b.id}
              className={`rounded-xl border p-5 ${
                awaitingListerConfirm
                  ? "border-accent/40 bg-accent/5"
                  : "border-anthracite-100"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/listings/${b.listing.id}`}
                    className="font-semibold text-anthracite hover:text-accent"
                  >
                    {b.listing.title}
                  </Link>
                  {awaitingListerConfirm && (
                    <p className="mt-1 inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                      Action requise — valider la fin de location
                    </p>
                  )}
                  <p className="mt-1 text-sm text-anthracite-500">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)} ·{" "}
                    {BOOKING_STATUS_LABELS[b.status]}
                  </p>
                  <p className="text-sm text-anthracite-400">
                    {view === "lister"
                      ? `Locataire : ${b.renter.name}`
                      : `Loueur : ${b.lister.name}`}
                  </p>
                  <p className="mt-1 font-medium text-accent">
                    {formatCents(b.totalAmount)}
                  </p>
                  {b.payment && (
                    <p className="text-xs text-anthracite-400">
                      {PAYMENT_STATUS_LABELS[b.payment.status]}
                      {b.listerApprovedAt &&
                        b.status === "PENDING" &&
                        " · approuvée, en attente de paiement"}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {b.conversation && (
                    <Link
                      href={`/dashboard/messages/${b.conversation.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-anthracite-200 px-3 py-2 text-sm font-medium text-anthracite-600 hover:border-accent hover:text-accent"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Messages
                    </Link>
                  )}
                  <BookingActions
                    bookingId={b.id}
                    listingTitle={b.listing.title}
                    status={b.status}
                    role={view === "lister" ? "lister" : "renter"}
                    endDate={b.endDate}
                    renterCompletedAt={b.renterCompletedAt?.toISOString() ?? null}
                    listerApprovedAt={b.listerApprovedAt?.toISOString() ?? null}
                    paymentStatus={b.payment?.status ?? null}
                    cancellationPolicy={b.cancellationPolicy}
                    stripePaymentsEnabled={stripePaymentsEnabled}
                  />
                </div>
              </div>
              {b.status === "COMPLETED" && b.reviews.length === 0 && (
                <ReviewForm
                  bookingId={b.id}
                  showEquipmentReview={view !== "lister"}
                />
              )}
            </article>
            );
          })
        )}
      </div>
    </div>
  );
}

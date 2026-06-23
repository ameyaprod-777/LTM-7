import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessTier } from "@/lib/permissions";
import {
  SERVICE_CATEGORY_LABELS,
  SERVICE_RATE_LABELS,
} from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ServiceQuoteRequest } from "@/components/services/service-quote-request";
import { ServiceQuotePaymentPanel } from "@/components/services/service-quote-payment-panel";
import { ServiceViewTracker } from "@/components/services/service-view-tracker";
import { ReportServiceButton } from "@/components/services/report-service-button";
import { AvailabilityCalendar } from "@/components/listings/availability-calendar";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { hasVerifiedKycIdentity } from "@/lib/membership-labels";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
  });

  if (!service) {
    return { title: "Service introuvable" };
  }

  return buildPageMetadata({
    title: service.title,
    description: service.description.slice(0, 160),
    path: `/services/${service.id}`,
    imageUrl: service.photos[0]?.url ?? null,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const tier = getAccessTier(!!session, session?.user?.role, session?.user?.status);

  if (tier === "visitor") {
    redirect("/register");
  }

  const service = await prisma.service.findUnique({
    where: { id: params.id, status: "ACTIVE" },
    include: {
      photos: { orderBy: { order: "asc" } },
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          city: true,
          bio: true,
          kycVerifiedAt: true,
          identityExpiresAt: true,
          memberSince: true,
        },
      },
    },
  });

  if (!service) notFound();

  const isOwner = session?.user?.id === service.ownerId;
  const isMember = tier === "member" || tier === "admin";

  const acceptedQuote =
    isMember && session?.user?.id && !isOwner
      ? await prisma.serviceQuote.findFirst({
          where: {
            serviceId: service.id,
            clientId: session.user.id,
            status: "ACCEPTED",
          },
          include: { payment: true },
        })
      : null;

  const stripePaymentsEnabled = !!process.env.STRIPE_SECRET_KEY;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ServiceViewTracker serviceId={service.id} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {service.photos.length > 0 ? (
              service.photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-anthracite-100 ${i === 0 ? "sm:col-span-2" : ""}`}
                >
                  <Image src={photo.url} alt="" fill className="object-cover" unoptimized />
                </div>
              ))
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-gradient-to-br from-anthracite-800 to-anthracite-900 text-white/40 sm:col-span-2">
                Prestation pro
              </div>
            )}
          </div>

          <span className="mt-6 inline-block rounded-full bg-accent-muted px-3 py-1 text-sm font-medium text-accent">
            {SERVICE_CATEGORY_LABELS[service.category]}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-anthracite">{service.title}</h1>
          <p className="mt-2 text-anthracite-500">
            {service.city}
            {service.neighborhood && ` · ${service.neighborhood}`}
            {service.experienceYears != null &&
              ` · ${service.experienceYears} an${service.experienceYears > 1 ? "s" : ""} d'exp.`}
          </p>

          <div className="prose prose-sm mt-8 max-w-none text-anthracite-600">
            <p className="whitespace-pre-wrap">{service.description}</p>
          </div>

          {service.portfolioUrl && (
            <a
              href={service.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Voir le portfolio
            </a>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-anthracite-100 bg-white p-6 shadow-sm">
            {isMember ? (
              <>
                <p className="text-3xl font-bold text-accent">
                  {formatCents(service.priceAmount)}
                </p>
                <p className="text-sm text-anthracite-500">
                  {SERVICE_RATE_LABELS[service.rateType]}
                </p>
              </>
            ) : (
              <p className="text-sm text-anthracite-500">
                Tarif visible après validation de votre adhésion
              </p>
            )}

            {!isOwner && isMember && (
              <div className="mt-6 space-y-4">
                {acceptedQuote ? (
                  <ServiceQuotePaymentPanel
                    quoteId={acceptedQuote.id}
                    status={acceptedQuote.status}
                    serviceTitle={service.title}
                    proposedAmount={acceptedQuote.proposedAmount}
                    servicePriceAmount={service.priceAmount}
                    agreedPaymentTiming={acceptedQuote.agreedPaymentTiming}
                    payment={
                      acceptedQuote.payment
                        ? {
                            status: acceptedQuote.payment.status,
                            method: acceptedQuote.payment.method,
                            clientDeclaredCashAt:
                              acceptedQuote.payment.clientDeclaredCashAt?.toISOString() ??
                              null,
                          }
                        : null
                    }
                    stripePaymentsEnabled={stripePaymentsEnabled}
                  />
                ) : (
                  <ServiceQuoteRequest
                    serviceId={service.id}
                    serviceTitle={service.title}
                    rateType={service.rateType}
                  />
                )}
                <AvailabilityCalendar serviceId={service.id} />
              </div>
            )}
            {!isOwner && isMember && (
              <div className="mt-4">
                <ReportServiceButton serviceId={service.id} />
              </div>
            )}
            {isOwner && (
              <Link href={`/services/${service.id}/edit`} className="mt-6 block">
                <Button variant="outline" className="w-full">
                  Modifier
                </Button>
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
            <Link
              href={`/profile/${service.owner.id}`}
              className="flex items-center gap-4 hover:opacity-90"
            >
              {service.owner.image ? (
                <Image
                  src={service.owner.image}
                  alt=""
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-anthracite-100 text-lg font-bold">
                  {service.owner.name?.[0] ?? "?"}
                </span>
              )}
              <div>
                <p className="flex items-center gap-1 font-semibold text-anthracite">
                  {service.owner.name}
                  {hasVerifiedKycIdentity(service.owner) && (
                    <BadgeCheck className="h-4 w-4 text-blue-600" aria-label="Identité vérifiée" />
                  )}
                </p>
                <p className="text-sm text-anthracite-500">{service.owner.city}</p>
                {service.owner.memberSince && (
                  <p className="text-xs text-anthracite-400">
                    Membre depuis {formatDate(service.owner.memberSince)}
                  </p>
                )}
              </div>
            </Link>
            {service.owner.bio && (
              <p className="mt-4 line-clamp-4 text-sm text-anthracite-600">
                {service.owner.bio}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

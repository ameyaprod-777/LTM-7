import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessTier, canRent } from "@/lib/permissions";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  DELIVERY_OPTION_LABELS,
  CANCELLATION_LABELS,
} from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { BookingForm } from "@/components/listings/booking-form";
import { AvailabilityCalendar } from "@/components/listings/availability-calendar";
import { ListingViewTracker } from "@/components/listings/listing-view-tracker";
import { ReportListingButton } from "@/components/listings/report-listing-button";
import { isBookingPaymentsAvailable } from "@/lib/stripe-config";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
  });

  if (!listing) {
    return { title: "Annonce introuvable" };
  }

  const category =
    CATEGORY_LABELS[listing.category as keyof typeof CATEGORY_LABELS] ??
    listing.category;

  return buildPageMetadata({
    title: listing.title,
    description: `${category} · ${listing.city} · ${formatCents(listing.pricePerDay)}/jour — ${listing.description.slice(0, 140)}…`,
    path: `/listings/${listing.id}`,
    imageUrl: listing.photos[0]?.url ?? null,
  });
}

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const tier = getAccessTier(!!session, session?.user?.role, session?.user?.status);

  if (tier === "visitor") {
    redirect("/register");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id, status: "ACTIVE" },
    include: {
      photos: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          city: true,
          memberSince: true,
          verifiedIdentity: true,
          kycVerifiedAt: true,
          identityExpiresAt: true,
        },
      },
    },
  });

  if (!listing) notFound();

  const isOwner = session?.user?.id === listing.ownerId;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ListingViewTracker listingId={listing.id} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {listing.photos.length > 0 ? (
              listing.photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-anthracite-100 ${i === 0 ? "sm:col-span-2" : ""}`}
                >
                  <Image src={photo.url} alt="" fill className="object-cover" unoptimized />
                </div>
              ))
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-anthracite-100 text-anthracite-400 sm:col-span-2">
                Pas de photo
              </div>
            )}
          </div>

          <h1 className="mt-6 text-3xl font-bold text-anthracite">{listing.title}</h1>
          <p className="mt-2 text-anthracite-500">
            {CATEGORY_LABELS[listing.category]} · {listing.city}
            {listing.neighborhood && ` · ${listing.neighborhood}`}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {listing.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent"
              >
                {tag.name}
              </span>
            ))}
            <span className="rounded-full bg-anthracite-100 px-3 py-1 text-xs font-medium">
              {CONDITION_LABELS[listing.condition]}
            </span>
            <span className="rounded-full bg-anthracite-100 px-3 py-1 text-xs font-medium">
              {DELIVERY_OPTION_LABELS[listing.deliveryOption]}
            </span>
            <span className="rounded-full bg-anthracite-100 px-3 py-1 text-xs font-medium">
              Annulation {CANCELLATION_LABELS[listing.cancellationPolicy].toLowerCase()}
            </span>
          </div>

          <div className="prose prose-sm mt-6 max-w-none text-anthracite-600">
            <p className="whitespace-pre-wrap">{listing.description}</p>
          </div>

          <div className="mt-8">
            <AvailabilityCalendar listingId={listing.id} />
          </div>

          <Link
            href={`/profile/${listing.owner.id}`}
            className="mt-8 flex items-center gap-4 rounded-xl border border-anthracite-100 p-4 hover:bg-anthracite-50"
          >
            {listing.owner.image ? (
              <Image src={listing.owner.image} alt="" width={48} height={48} className="rounded-full" unoptimized />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-anthracite-200 font-bold">
                {listing.owner.name?.[0]}
              </span>
            )}
            <div>
              <p className="font-semibold text-anthracite">{listing.owner.name}</p>
              <p className="text-sm text-anthracite-500">
                {listing.owner.city}
                {listing.owner.memberSince &&
                  ` · Membre depuis ${formatDate(listing.owner.memberSince)}`}
              </p>
            </div>
          </Link>

          {isOwner && (
            <Link
              href={`/listings/${listing.id}/edit`}
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Modifier l&apos;annonce
            </Link>
          )}

          {!isOwner && (
            <div className="mt-6">
              <ReportListingButton listingId={listing.id} />
            </div>
          )}
        </div>

        <div>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-anthracite-100 bg-anthracite-50 p-4">
              <p className="text-2xl font-bold text-anthracite">
                {formatCents(listing.pricePerDay)}
                <span className="text-base font-normal text-anthracite-500"> / jour</span>
              </p>
              {listing.weekendPricePerDay && (
                <p className="text-sm text-anthracite-500">
                  {formatCents(listing.weekendPricePerDay)} / jour (week-end)
                </p>
              )}
              {listing.pricePerWeek && (
                <p className="text-sm text-anthracite-500">
                  {formatCents(listing.pricePerWeek)} / semaine (7 j+)
                </p>
              )}
            </div>

            {canRent(tier) && !isOwner && (
              <BookingForm
                paymentsAvailable={isBookingPaymentsAvailable()}
                listingId={listing.id}
                pricePerDay={listing.pricePerDay}
                deliveryOption={listing.deliveryOption}
                deliveryFlatFee={listing.deliveryFlatFee}
                deliveryFeePerKm={listing.deliveryFeePerKm}
                deliveryRadiusKm={listing.deliveryRadiusKm}
                deliveryPricingType={listing.deliveryPricingType}
                deliverySlots={listing.deliverySlots}
              />
            )}

            {tier === "pending" && (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                La réservation sera disponible après validation de votre adhésion.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

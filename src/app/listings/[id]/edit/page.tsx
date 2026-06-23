import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/listings/listing-form";
import { DeleteResourceButton } from "@/components/dashboard/delete-resource-button";
export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!listing) notFound();
  if (
    listing.ownerId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    redirect("/listings");
  }

  const conversionRate =
    listing.viewCount > 0
      ? Math.round((listing._count.bookings / listing.viewCount) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-anthracite">Modifier l&apos;annonce</h1>

      <div className="mt-4 grid gap-3 rounded-xl border border-anthracite-100 bg-anthracite-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-anthracite-500">Vues</p>
          <p className="font-semibold text-anthracite">{listing.viewCount}</p>
        </div>
        <div>
          <p className="text-anthracite-500">Réservations</p>
          <p className="font-semibold text-anthracite">{listing._count.bookings}</p>
        </div>
        <div>
          <p className="text-anthracite-500">Conversion</p>
          <p className="font-semibold text-anthracite">{conversionRate} %</p>
        </div>
      </div>

      <div className="mt-8">
        <ListingForm
          listingId={listing.id}
          defaultValues={{
            title: listing.title,
            description: listing.description,
            category: listing.category,
            pricePerDay: listing.pricePerDay,
            pricePerWeek: listing.pricePerWeek ?? undefined,
            weekendPricePerDay: listing.weekendPricePerDay ?? undefined,
            condition: listing.condition,
            city: listing.city,
            neighborhood: listing.neighborhood ?? "",
            deliveryOption: listing.deliveryOption,
            deliveryRadiusKm: listing.deliveryRadiusKm ?? undefined,
            deliveryPricingType: listing.deliveryPricingType ?? undefined,
            deliveryFlatFee: listing.deliveryFlatFee ?? undefined,
            deliveryFeePerKm: listing.deliveryFeePerKm ?? undefined,
            deliverySlots: listing.deliverySlots,
            cancellationPolicy: listing.cancellationPolicy,
            photoUrls: listing.photos.map((p) => p.url),
            tagNames: listing.tags.map((t) => t.tag.name),
          }}
        />
      </div>

      {listing.status !== "REMOVED" && (
        <div className="mt-12 border-t border-anthracite-100 pt-8">
          <h2 className="text-sm font-semibold text-anthracite">Zone de danger</h2>
          <p className="mt-1 text-sm text-anthracite-500">
            La suppression retire l&apos;annonce de la plateforme. Impossible si
            des réservations sont en cours.
          </p>
          <div className="mt-4">
            <DeleteResourceButton
              kind="listing"
              resourceId={listing.id}
              title={listing.title}
              variant="button"
            />
          </div>
        </div>
      )}
    </div>
  );
}

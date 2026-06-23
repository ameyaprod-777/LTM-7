import { Suspense } from "react";
import { getAccessContext } from "@/lib/session";
import { canViewListingDetails } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingsToolbar } from "@/components/listings/listings-toolbar";
import { ListingsPageHeader } from "@/components/listings/listings-page-header";
import {
  buildListingsWhere,
  buildListingsOrderBy,
  type ListingsSearchParams,
} from "@/lib/listings-query";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Annonces" };

function ToolbarFallback() {
  return (
    <div className="h-28 animate-pulse rounded-2xl bg-anthracite-100" />
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: ListingsSearchParams;
}) {
  const { tier } = await getAccessContext();
  const showDetails = canViewListingDetails(tier);

  const where = buildListingsWhere(searchParams);
  const orderBy = buildListingsOrderBy(searchParams.sort);

  const [listings, totalCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        photos: { orderBy: { order: "asc" }, take: 1 },
        owner: { select: { name: true, city: true, image: true } },
      },
      orderBy,
      take: 48,
    }),
    prisma.listing.count({ where }),
  ]);

  const hasFilters = !!(
    searchParams.q ||
    searchParams.category ||
    searchParams.city ||
    searchParams.sort
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <ListingsPageHeader showDetails={showDetails} totalCount={totalCount} />

      <div className="mt-8">
        <Suspense fallback={<ToolbarFallback />}>
          <ListingsToolbar
            showMapLink={showDetails}
            activeView="list"
            resultCount={totalCount}
          />
        </Suspense>
      </div>

      {listings.length === 0 ? (
        <div className="mt-16">
          <EmptyState
            icon={SearchX}
            title="Aucune annonce trouvée"
            description={
              hasFilters
                ? "Essayez d'autres mots-clés ou élargissez vos filtres."
                : "Revenez bientôt — de nouveaux équipements arrivent régulièrement."
            }
            {...(hasFilters
              ? { action: { href: "/listings", label: "Voir toutes les annonces" } }
              : tier === "member" || tier === "admin"
                ? { action: { href: "/listings/new", label: "Publier une annonce" } }
                : {})}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              variant={
                showDetails ? "full" : tier !== "visitor" ? "preview" : "teaser"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

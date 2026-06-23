import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { getAccessContext } from "@/lib/session";
import { canViewListingDetails } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ServiceCard } from "@/components/services/service-card";
import { ServicesToolbar } from "@/components/services/services-toolbar";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import {
  buildServicesWhere,
  buildServicesOrderBy,
  type ServicesSearchParams,
} from "@/lib/services-query";

export const metadata = {
  title: "Services",
  description: "Prestations audiovisuelles : chef op, pilote drone FPV, son, montage…",
};

function ToolbarFallback() {
  return <div className="h-28 animate-pulse rounded-2xl bg-anthracite-100" />;
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: ServicesSearchParams;
}) {
  const { tier } = await getAccessContext();
  const showDetails = canViewListingDetails(tier);

  const where = buildServicesWhere(searchParams);
  const orderBy = buildServicesOrderBy(searchParams.sort);

  const [services, totalCount] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        photos: { orderBy: { order: "asc" }, take: 1 },
        owner: { select: { name: true, image: true } },
      },
      orderBy,
      take: 48,
    }),
    prisma.service.count({ where }),
  ]);

  const hasFilters = !!(
    searchParams.q ||
    searchParams.category ||
    searchParams.city ||
    searchParams.sort
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-anthracite sm:text-4xl">
            Services & prestations
          </h1>
          <p className="mt-2 text-anthracite-500">
            {totalCount > 0
              ? `${totalCount} professionnel${totalCount > 1 ? "s" : ""} disponible${totalCount > 1 ? "s" : ""}`
              : "Pilotes drone, chefs op, monteurs, son… Trouvez le bon profil pour votre projet"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!showDetails ? (
            <Link href="/register">
              <Button>
                <Lock className="mr-2 h-4 w-4" />
                Rejoindre
              </Button>
            </Link>
          ) : (
            <Link href="/services/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Proposer un service
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<ToolbarFallback />}>
          <ServicesToolbar resultCount={totalCount} />
        </Suspense>
      </div>

      {services.length === 0 ? (
        <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50/50 px-6 py-16 text-center">
          <SearchX className="h-12 w-12 text-anthracite-300" />
          <p className="mt-4 text-lg font-medium text-anthracite">
            Aucune prestation trouvée
          </p>
          <p className="mt-1 max-w-sm text-sm text-anthracite-500">
            {hasFilters
              ? "Modifiez vos critères ou proposez votre propre service."
              : "Soyez le premier à publier une offre de service."}
          </p>
          {hasFilters ? (
            <Link href="/services" className="mt-6">
              <Button variant="outline">Voir tous les services</Button>
            </Link>
          ) : showDetails ? (
            <Link href="/services/new" className="mt-6">
              <Button>Proposer un service</Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
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

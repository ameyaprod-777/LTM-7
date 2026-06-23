import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/session";
import { canViewListingDetails } from "@/lib/permissions";
import { ListingsMapView } from "@/components/listings/listings-map-view";
import { ListingsToolbar } from "@/components/listings/listings-toolbar";

export const metadata = {
  title: "Carte des annonces",
  description: "Trouvez le matériel le plus proche de vous ou de votre lieu de tournage",
};

function ToolbarFallback() {
  return <div className="h-28 animate-pulse rounded-2xl bg-anthracite-100" />;
}

export default async function ListingsMapPage() {
  const { tier } = await getAccessContext();
  if (!canViewListingDetails(tier)) {
    redirect("/apply?reason=membership-required");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-anthracite sm:text-4xl">
          Carte des annonces
        </h1>
        <p className="mt-2 text-anthracite-500">
          Repérez le matériel près de chez vous ou de votre lieu de tournage
        </p>
      </div>

      <div className="mt-8">
        <Suspense fallback={<ToolbarFallback />}>
          <ListingsToolbar showMapLink activeView="map" />
        </Suspense>
      </div>

      <div className="mt-6">
        <ListingsMapView />
      </div>
    </div>
  );
}

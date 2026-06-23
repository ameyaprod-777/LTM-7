import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessTier, canPostListings } from "@/lib/permissions";
import { ServiceForm } from "@/components/services/service-form";
import { AvailabilityCalendar } from "@/components/listings/availability-calendar";
import { ServiceQuotesPanel } from "@/components/services/service-quotes-panel";
import { DeleteResourceButton } from "@/components/dashboard/delete-resource-button";
export const metadata = { title: "Modifier le service" };

export default async function EditServicePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const tier = getAccessTier(!!session, session?.user?.role, session?.user?.status);

  if (!canPostListings(tier)) {
    redirect("/apply?reason=membership-required");
  }

  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!service || service.ownerId !== session?.user?.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-anthracite">Modifier le service</h1>
      <div className="mt-8">
        <ServiceForm
          serviceId={service.id}
          defaultValues={{
            title: service.title,
            description: service.description,
            category: service.category,
            rateType: service.rateType,
            priceAmount: service.priceAmount,
            city: service.city,
            neighborhood: service.neighborhood ?? "",
            experienceYears: service.experienceYears,
            portfolioUrl: service.portfolioUrl ?? "",
            photoUrls: service.photos.map((p) => p.url),
          }}
        />
      </div>
      <div className="mt-10">
        <AvailabilityCalendar serviceId={service.id} editable />
      </div>
      <ServiceQuotesPanel serviceId={service.id} />

      {service.status !== "REMOVED" && (
        <div className="mt-12 border-t border-anthracite-100 pt-8">
          <h2 className="text-sm font-semibold text-anthracite">Zone de danger</h2>
          <p className="mt-1 text-sm text-anthracite-500">
            La suppression retire le service de la plateforme. Impossible si des
            demandes de devis sont en cours.
          </p>
          <div className="mt-4">
            <DeleteResourceButton
              kind="service"
              resourceId={service.id}
              title={service.title}
              variant="button"
            />
          </div>
        </div>
      )}
    </div>
  );
}

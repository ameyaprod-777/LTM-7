import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { SERVICE_CATEGORY_LABELS, SERVICE_RATE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ServiceRowActions } from "@/components/dashboard/service-row-actions";
import { Plus } from "lucide-react";

export const metadata = { title: "Mes services" };

export default async function DashboardServicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const services = await prisma.service.findMany({
    where: { ownerId: session.user.id, status: { not: "REMOVED" } },
    include: { photos: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-anthracite">Mes services</h1>
        <Link href="/services/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau service
          </Button>
        </Link>
      </div>
      <div className="mt-8 space-y-3">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-anthracite-100 p-4"
          >
            <div>
              <Link href={`/services/${s.id}`} className="font-medium hover:text-accent">
                {s.title}
              </Link>
              <p className="text-sm text-anthracite-500">
                {SERVICE_CATEGORY_LABELS[s.category]} · {formatCents(s.priceAmount)}{" "}
                {SERVICE_RATE_LABELS[s.rateType]} · {s.status}
              </p>
            </div>
            <ServiceRowActions serviceId={s.id} title={s.title} />
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-anthracite-500">
            Vous n&apos;avez pas encore publié de prestation.{" "}
            <Link href="/services/new" className="text-accent hover:underline">
              Proposer un service
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

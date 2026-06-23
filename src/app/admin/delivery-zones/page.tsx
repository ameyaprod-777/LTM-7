import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdminRole } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { DeliveryZonesManager } from "@/components/admin/delivery-zones-manager";

export const metadata = { title: "Zones de livraison — Admin" };

export default async function AdminDeliveryZonesPage() {
  const session = await getServerSession(authOptions);
  if (!isSuperAdminRole(session?.user?.role)) redirect("/admin");

  const zones = await prisma.deliveryZone.findMany({
    orderBy: [{ active: "desc" }, { city: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Zones de livraison</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Gérer les zones couvertes pour la livraison de matériel.
      </p>

      <div className="mt-8">
        <DeliveryZonesManager zones={zones} />
      </div>
    </div>
  );
}

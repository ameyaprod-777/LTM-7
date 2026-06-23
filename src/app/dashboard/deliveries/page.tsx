import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeliveryTasksList } from "@/components/deliveries/delivery-tasks-list";

export const metadata = { title: "Livraisons" };

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const asLister = searchParams.role === "lister";

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Livraisons</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Suivi des livraisons liées à vos réservations.
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          href="/dashboard/deliveries"
          className={`rounded-lg px-3 py-1.5 text-sm ${!asLister ? "bg-accent text-white" : "bg-anthracite-100"}`}
        >
          Mes locations (locataire)
        </Link>
        <Link
          href="/dashboard/deliveries?role=lister"
          className={`rounded-lg px-3 py-1.5 text-sm ${asLister ? "bg-accent text-white" : "bg-anthracite-100"}`}
        >
          Mes annonces (loueur)
        </Link>
      </div>

      <div className="mt-8">
        <DeliveryTasksList asLister={asLister} />
      </div>
    </div>
  );
}

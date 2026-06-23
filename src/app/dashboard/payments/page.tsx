import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PaymentHistory } from "@/components/payments/payment-history";

export const metadata = { title: "Historique des paiements" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = searchParams.role ?? "renter";
  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm ${active ? "bg-accent text-white" : "bg-anthracite-100"}`;

  const historyRole =
    role === "lister"
      ? "lister"
      : role === "provider"
        ? "provider"
        : role === "service-client"
          ? "service-client"
          : "renter";

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Historique des paiements</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Locations de matériel et prestations de services.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/payments" className={tabClass(role === "renter")}>
          Locations · locataire
        </Link>
        <Link
          href="/dashboard/payments?role=lister"
          className={tabClass(role === "lister")}
        >
          Locations · loueur
        </Link>
        <Link
          href="/dashboard/payments?role=provider"
          className={tabClass(role === "provider")}
        >
          Prestations · prestataire
        </Link>
        <Link
          href="/dashboard/payments?role=service-client"
          className={tabClass(role === "service-client")}
        >
          Prestations · client
        </Link>
      </div>

      <div className="mt-8">
        <PaymentHistory role={historyRole} />
      </div>
    </div>
  );
}

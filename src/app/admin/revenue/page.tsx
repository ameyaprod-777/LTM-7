import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdminRole } from "@/lib/staff";
import { getAdminRevenueStats } from "@/lib/admin-revenue";
import { AdminRevenueDashboard } from "@/components/admin/admin-revenue-dashboard";

export const metadata = { title: "Revenus — Admin" };

export default async function AdminRevenuePage() {
  const session = await getServerSession(authOptions);
  if (!isSuperAdminRole(session?.user?.role)) redirect("/admin");

  const stats = await getAdminRevenueStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Revenus & commissions</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Chiffre d&apos;affaires plateforme et paiements en attente de libération.
      </p>

      <div className="mt-8">
        <AdminRevenueDashboard
          totalCommissionEur={stats.totalCommissionCents / 100}
          completedBookings={stats.completedBookings}
          heldPaymentsCount={stats.heldPaymentsCount}
          heldAmountEur={stats.heldAmountCents / 100}
          heldCommissionEur={stats.heldCommissionCents / 100}
          releasedVolumeEur={stats.releasedVolumeCents / 100}
          activeBookings={stats.activeBookings}
          monthlyChart={stats.monthlyChart}
        />
      </div>
    </div>
  );
}

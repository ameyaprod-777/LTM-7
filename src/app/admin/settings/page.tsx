import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSettingsForm } from "@/components/admin/settings-form";
import { AdminExportsPanel } from "@/components/admin/admin-exports-panel";
import { ArrowLeft } from "lucide-react";
import { isSuperAdminRole } from "@/lib/staff";

export const metadata = { title: "Paramètres plateforme" };

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!isSuperAdminRole(session?.user?.role)) redirect("/admin");

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-anthracite-500">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-anthracite">Paramètres</h1>
      <div className="mt-8 space-y-8">
        <AdminSettingsForm
          commissionRate={settings?.commissionRate ?? 0.12}
          invitationsEnabled={settings?.invitationsEnabled ?? true}
          registrationClosed={settings?.registrationClosed ?? false}
          maintenanceBanner={settings?.maintenanceBanner ?? ""}
          maintenanceBannerEnabled={settings?.maintenanceBannerEnabled ?? false}
        />
        <AdminExportsPanel />
      </div>
    </div>
  );
}

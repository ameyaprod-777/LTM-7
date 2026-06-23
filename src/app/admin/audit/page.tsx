import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperAdminRole } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { AdminAuditTable } from "@/components/admin/admin-audit-table";

export const metadata = { title: "Journal d'audit — Admin" };

export default async function AdminAuditPage() {
  const session = await getServerSession(authOptions);
  if (!isSuperAdminRole(session?.user?.role)) redirect("/admin");

  const logs = await prisma.auditLog.findMany({
    include: { admin: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Journal d&apos;audit</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Historique des actions administrateur sur la plateforme.
      </p>

      <AdminAuditTable
        logs={logs.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

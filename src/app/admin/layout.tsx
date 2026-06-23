import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { isStaffRole } from "@/lib/staff";
import { USER_ROLE_LABELS } from "@/lib/validations/admin-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        Espace staff — {USER_ROLE_LABELS[session.user.role]} ·{" "}
        <strong>{session.user.email}</strong>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <AdminNav role={session.user.role} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

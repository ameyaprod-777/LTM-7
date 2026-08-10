import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardNav, DASHBOARD_NAV_LINKS } from "@/components/dashboard/nav";
import { DashboardMobileTabs } from "@/components/dashboard/mobile-tabs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <DashboardMobileTabs links={DASHBOARD_NAV_LINKS} />
      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <DashboardNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

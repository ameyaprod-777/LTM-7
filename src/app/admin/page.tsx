import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  Users,
  Clock,
  Package,
  Euro,
  Calendar,
  Radio,
  ClipboardList,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole, isSuperAdminRole } from "@/lib/staff";
import { getAdminRevenueStats } from "@/lib/admin-revenue";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/");
  }

  const superAdmin = isSuperAdminRole(session.user.role);

  const [members, pendingApps, activeListings, flaggedPosts, disputedBookings, revenue] =
    await Promise.all([
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.membershipApplication.count({ where: { status: "PENDING" } }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.forumPost.count({ where: { flagged: true } }),
      prisma.booking.count({ where: { status: "DISPUTED" } }),
      superAdmin ? getAdminRevenueStats() : null,
    ]);

  const stats = [
    { label: "Membres actifs", value: members, icon: Users, href: "/admin/users" },
    {
      label: "Demandes en attente",
      value: pendingApps,
      icon: Clock,
      href: "/admin/membership",
    },
    { label: "Annonces actives", value: activeListings, icon: Package, href: "/admin/listings" },
    {
      label: "Publications signalées",
      value: flaggedPosts,
      icon: Radio,
      href: "/admin/forum?flagged=1",
    },
    {
      label: "Litiges ouverts",
      value: disputedBookings,
      icon: Calendar,
      href: "/admin/bookings?status=DISPUTED",
    },
    ...(superAdmin && revenue
      ? [
          {
            label: "CA commissions",
            value: `${(revenue.totalCommissionCents / 100).toFixed(0)} €`,
            icon: Euro,
            href: "/admin/revenue",
          },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-anthracite">Administration</h1>
      <p className="mt-1 text-anthracite-500">Vue d&apos;ensemble de la plateforme</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-anthracite-100 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <stat.icon className="h-6 w-6 text-accent" />
            <p className="mt-4 text-2xl font-bold text-anthracite">{stat.value}</p>
            <p className="text-sm text-anthracite-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {superAdmin && revenue && (
        <div className="mt-8 rounded-2xl border border-anthracite-100 bg-white p-6">
          <h2 className="font-semibold text-anthracite">Revenus (aperçu)</h2>
          <p className="mt-2 text-sm text-anthracite-600">
            {revenue.heldPaymentsCount} paiement(s) en attente de libération ·{" "}
            {(revenue.heldAmountCents / 100).toFixed(0)} € bloqués
          </p>
          <Link href="/admin/revenue" className="mt-3 inline-block text-sm font-medium text-accent">
            Dashboard revenus →
          </Link>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/membership"
          className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Candidatures
          {pendingApps > 0 && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pendingApps}
            </span>
          )}
        </Link>
        <Link href="/admin/bookings" className="rounded-lg border border-anthracite-200 px-5 py-2.5 text-sm font-medium hover:border-accent">
          Réservations
        </Link>
        <Link href="/admin/forum" className="rounded-lg border border-anthracite-200 px-5 py-2.5 text-sm font-medium hover:border-accent">
          Fil Actu
        </Link>
        {superAdmin && (
          <>
            <Link href="/admin/audit" className="inline-flex items-center gap-1 rounded-lg border border-anthracite-200 px-5 py-2.5 text-sm font-medium hover:border-accent">
              <ClipboardList className="h-4 w-4" /> Audit
            </Link>
            <Link href="/admin/settings" className="rounded-lg border border-anthracite-200 px-5 py-2.5 text-sm font-medium hover:border-accent">
              Paramètres
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { isSuperAdminRole } from "@/lib/staff";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  LifeBuoy,
  Settings,
  Package,
  Briefcase,
  Radio,
  Star,
  Calendar,
  Euro,
  ClipboardList,
  Truck,
  Download,
} from "lucide-react";

const links: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  superAdminOnly?: boolean;
}[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Profils & membres", icon: Users },
  { href: "/admin/membership", label: "Candidatures", icon: UserCheck },
  { href: "/admin/listings", label: "Annonces", icon: Package },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/bookings", label: "Réservations", icon: Calendar },
  { href: "/admin/forum", label: "Fil Actu", icon: Radio },
  { href: "/admin/reviews", label: "Avis", icon: Star },
  { href: "/admin/tickets", label: "Support", icon: LifeBuoy },
  { href: "/admin/revenue", label: "Revenus", icon: Euro, superAdminOnly: true },
  { href: "/admin/audit", label: "Audit", icon: ClipboardList, superAdminOnly: true },
  {
    href: "/admin/delivery-zones",
    label: "Zones livraison",
    icon: Truck,
    superAdminOnly: true,
  },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, superAdminOnly: true },
];

export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const superAdmin = isSuperAdminRole(role);

  const visible = links.filter((l) => !l.superAdminOnly || superAdmin);

  return (
    <nav className="flex flex-wrap gap-2 border-b border-anthracite-100 pb-4 lg:flex-col lg:border-b-0 lg:pb-0">
      {visible.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-white"
                : "text-anthracite-600 hover:bg-anthracite-50"
            )}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
      {superAdmin && (
        <Link
          href="/api/admin/export/members"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-anthracite-600 hover:bg-anthracite-50 lg:mt-4"
        >
          <Download className="h-4 w-4 shrink-0" />
          Export membres
        </Link>
      )}
    </nav>
  );
}

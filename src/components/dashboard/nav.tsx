"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Calendar,
  MessageSquare,
  Settings,
  LifeBuoy,
  Briefcase,
  Truck,
  CreditCard,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MessagesUnreadBadge } from "@/components/messages/messages-unread-badge";

export type DashboardNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_LINKS: DashboardNavLink[] = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/listings", label: "Mes annonces", icon: Package },
  { href: "/members", label: "Membres", icon: Users },
  { href: "/dashboard/services", label: "Mes services", icon: Briefcase },
  { href: "/dashboard/bookings", label: "Réservations", icon: Calendar },
  { href: "/dashboard/deliveries", label: "Livraisons", icon: Truck },
  { href: "/dashboard/payments", label: "Paiements", icon: CreditCard },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export function DashboardNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Espace membre">
      {DASHBOARD_NAV_LINKS.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent-muted text-accent"
                : "text-anthracite-500 hover:bg-anthracite-50 hover:text-anthracite"
            )}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{link.label}</span>
            {link.href === "/dashboard/messages" && <MessagesUnreadBadge />}
          </Link>
        );
      })}
    </nav>
  );
}

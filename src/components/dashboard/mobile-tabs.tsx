"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashboardNavLink } from "@/components/dashboard/nav";

export function DashboardMobileTabs({ links }: { links: DashboardNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-3 mb-4 border-b border-anthracite-100 md:hidden"
      aria-label="Navigation espace membre"
    >
      <ul className="flex gap-1 overflow-x-auto overscroll-x-contain px-3 pb-2 scrollbar-none">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-accent text-white"
                    : "bg-anthracite-50 text-anthracite-600 hover:bg-anthracite-100"
                )}
              >
                <link.icon className="h-3.5 w-3.5 shrink-0" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

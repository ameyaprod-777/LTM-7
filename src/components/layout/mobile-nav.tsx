"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_LINKS } from "@/components/dashboard/nav";

type NavLink = { href: string; label: string };

type Props = {
  links: NavLink[];
  showAdmin: boolean;
  isAuthenticated: boolean;
};

export function MobileNav({ links, showAdmin, isAuthenticated }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const publicLinks = [
    ...links,
    ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-anthracite-200 text-anthracite hover:bg-anthracite-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-anthracite/40"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav-panel"
            className="fixed inset-y-0 right-0 z-[70] flex w-[min(100%,20rem)] flex-col border-l border-anthracite-100 bg-white shadow-xl pb-[env(safe-area-inset-bottom)]"
            aria-label="Navigation principale"
          >
            <div className="flex h-14 items-center justify-between border-b border-anthracite-100 px-4 pt-[env(safe-area-inset-top)]">
              <span className="text-sm font-semibold text-anthracite">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2.5 hover:bg-anthracite-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-anthracite-400">
                Découvrir
              </p>
              <ul className="mb-6">
                {publicLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "block rounded-lg px-3 py-3 text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        pathname === link.href ||
                          (link.href !== "/" &&
                            pathname.startsWith(`${link.href}/`))
                          ? "bg-accent-muted text-accent"
                          : "text-anthracite-600 hover:bg-anthracite-50"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {isAuthenticated && (
                <>
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-anthracite-400">
                    Mon espace
                  </p>
                  <ul className="mb-4">
                    {DASHBOARD_NAV_LINKS.map((link) => {
                      const active =
                        pathname === link.href ||
                        (link.href !== "/dashboard" &&
                          pathname.startsWith(link.href));
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                              active
                                ? "bg-accent-muted text-accent"
                                : "text-anthracite-600 hover:bg-anthracite-50"
                            )}
                          >
                            <link.icon className="h-4 w-4 shrink-0" />
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            <div className="space-y-2 border-t border-anthracite-100 p-4">
              {isAuthenticated ? (
                <Link href="/api/auth/signout" className="block">
                  <Button variant="outline" className="w-full">
                    Déconnexion
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button className="w-full">Rejoindre la communauté</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

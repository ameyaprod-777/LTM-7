"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const publicLinks = [
    ...links,
    ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const panel =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            {/* Fond : ferme au tap */}
            <button
              type="button"
              className="ltm-menu-backdrop absolute inset-0 bg-anthracite/50"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
            />

            {/* Plein écran via portal : évite le piège fixed + backdrop-blur du header */}
            <nav
              id="mobile-nav-panel"
              className="ltm-menu-panel absolute inset-0 flex flex-col bg-white"
              style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
              aria-label="Navigation principale"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-anthracite-100 px-4">
                <div className="min-w-0">
                  <p
                    id={titleId}
                    className="text-base font-semibold tracking-tight text-anthracite"
                  >
                    Menu
                  </p>
                  <p className="truncate text-xs text-anthracite-400">
                    Loue<span className="text-accent">Ton</span>Matos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-anthracite-200 text-anthracite hover:bg-anthracite-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                <section className="mb-8">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-anthracite-400">
                    Découvrir
                  </p>
                  <ul className="grid gap-1">
                    {publicLinks.map((link) => {
                      const active =
                        pathname === link.href ||
                        (link.href !== "/" &&
                          pathname.startsWith(`${link.href}/`));
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              "flex min-h-12 items-center rounded-xl px-4 text-[17px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                              active
                                ? "bg-accent text-white"
                                : "text-anthracite hover:bg-anthracite-50"
                            )}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {isAuthenticated && (
                  <section className="mb-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-anthracite-400">
                      Mon espace
                    </p>
                    <ul className="grid gap-1">
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
                                "flex min-h-12 items-center gap-3 rounded-xl px-4 text-[17px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                                active
                                  ? "bg-accent-muted text-accent"
                                  : "text-anthracite-600 hover:bg-anthracite-50"
                              )}
                            >
                              <link.icon className="h-5 w-5 shrink-0 opacity-70" />
                              {link.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </div>

              <div className="shrink-0 space-y-2 border-t border-anthracite-100 bg-anthracite-50/60 px-4 py-4">
                {isAuthenticated ? (
                  <Link href="/api/auth/signout" className="block">
                    <Button variant="outline" className="h-12 w-full text-base">
                      Déconnexion
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="block">
                      <Button
                        variant="outline"
                        className="h-12 w-full text-base"
                      >
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/register" className="block">
                      <Button className="h-12 w-full text-base">
                        Rejoindre la communauté
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>,
          document.body
        )
      : null;

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
      {panel}
    </div>
  );
}

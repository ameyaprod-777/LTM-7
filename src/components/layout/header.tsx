import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessTier } from "@/lib/permissions";
import { getOnboardingStatus } from "@/lib/onboarding";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { OnboardingBanner } from "./onboarding-banner";
import { MobileNav } from "./mobile-nav";

const navLinks = [
  { href: "/listings", label: "Annonces" },
  { href: "/services", label: "Services" },
  { href: "/forum", label: "Actu" },
  { href: "/faq", label: "FAQ" },
];

export async function Header() {
  const session = await getServerSession(authOptions);
  const tier = getAccessTier(
    !!session,
    session?.user?.role,
    session?.user?.status
  );

  const onboarding =
    tier === "pending" && session?.user?.id
      ? await getOnboardingStatus(session.user.id)
      : null;

  return (
    <header className="sticky top-0 z-50 border-b border-anthracite-100 bg-white/95 backdrop-blur supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      {onboarding && <OnboardingBanner status={onboarding} />}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Logo compactOnMobile />
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Navigation principale"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-anthracite-500 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {link.label}
            </Link>
          ))}
          {tier === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-accent hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {session ? (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-anthracite hover:text-accent sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Tableau de bord
              </Link>
              <Link href="/api/auth/signout" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Déconnexion
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">Rejoindre</Button>
              </Link>
            </>
          )}
          <MobileNav
            links={navLinks}
            showAdmin={tier === "admin"}
            isAuthenticated={!!session}
          />
        </div>
      </div>
    </header>
  );
}

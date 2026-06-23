import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  CheckCircle,
  Clock,
  Package,
  Calendar,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessTier } from "@/lib/permissions";
import { InviteButton } from "@/components/dashboard/invite-button";
import { formatCents } from "@/lib/money";
import { getProviderEarningsCents } from "@/lib/provider-earnings";
import { MemberOnboarding } from "@/components/dashboard/member-onboarding";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { applied?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const tier = getAccessTier(true, session.user.role, session.user.status);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      application: true,
      _count: {
        select: {
          listings: true,
          bookingsAsRenter: true,
          bookingsAsLister: true,
        },
      },
    },
  });

  if (tier === "pending" && !user?.application) {
    redirect("/apply");
  }

  const earnings = await getProviderEarningsCents(session.user.id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-anthracite">
        Bonjour{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
      </h1>

      {searchParams.applied === "1" && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          Candidature envoyée — vous serez notifié par email.
        </div>
      )}

      {tier === "pending" && user?.application?.status === "INCOMPLETE" && (
        <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-8 w-8 shrink-0 text-orange-600" />
            <div>
              <h2 className="font-semibold text-orange-900">
                Pièces complémentaires requises
              </h2>
              {user.application.adminMessage && (
                <p className="mt-1 text-sm text-orange-800">
                  {user.application.adminMessage}
                </p>
              )}
              <Link
                href="/apply"
                className="mt-3 inline-block text-sm font-semibold text-accent hover:underline"
              >
                Compléter ma candidature →
              </Link>
            </div>
          </div>
        </div>
      )}

      {tier === "pending" && user?.application?.status === "REJECTED" && (
        <div className="mt-8 rounded-2xl border border-anthracite-200 bg-anthracite-50 p-6">
          <p className="text-sm text-anthracite-700">
            Votre candidature précédente n&apos;a pas été retenue. Vous pouvez en
            soumettre une nouvelle.
          </p>
          <Link
            href="/apply"
            className="mt-3 inline-block text-sm font-semibold text-accent hover:underline"
          >
            Nouvelle candidature →
          </Link>
        </div>
      )}

      {tier === "pending" && user?.application?.status === "PENDING" && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <h2 className="font-semibold text-amber-900">Candidature en examen</h2>
              <p className="text-sm text-amber-800">
                Parcourez les annonces en attendant la validation.
              </p>
            </div>
          </div>
        </div>
      )}

      {(tier === "member" || tier === "admin") && (
        <>
          <MemberOnboarding
            hasProfile={Boolean(user?.name && user?.city)}
            hasListing={(user?._count.listings ?? 0) > 0}
            dismissed={false}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Package}
              label="Mes annonces"
              value={String(user?._count.listings ?? 0)}
              href="/dashboard/listings"
            />
            <StatCard
              icon={Calendar}
              label="Locations"
              value={String(user?._count.bookingsAsRenter ?? 0)}
              href="/dashboard/bookings"
            />
            <StatCard
              icon={Calendar}
              label="En tant que loueur"
              value={String(user?._count.bookingsAsLister ?? 0)}
              href="/dashboard/bookings?role=lister"
            />
            <StatCard
              icon={MessageSquare}
              label="Messages"
              value="→"
              href="/dashboard/messages"
            />
          </div>
          <div className="mt-6 rounded-xl border border-anthracite-100 bg-white p-5">
            <p className="text-sm text-anthracite-500">Gains totaux (libérés)</p>
            <p className="text-2xl font-bold text-accent">
              {formatCents(earnings.totalCents)}
            </p>
            <p className="mt-1 text-xs text-anthracite-400">
              Locations {formatCents(earnings.listingCents)} · Prestations{" "}
              {formatCents(earnings.serviceCents)}
            </p>
          </div>
          <div className="mt-6">
            <InviteButton />
          </div>
        </>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <QuickLink href="/listings" title="Parcourir les annonces" desc="Trouver du matériel" />
        {(tier === "member" || tier === "admin") && (
          <QuickLink href="/listings/new" title="Proposer du matériel" desc="Publier une annonce" accent />
        )}
        <QuickLink href="/forum" title="Fil d'actualité" desc="Projets, besoins matériel, actus" />
        {(tier === "member" || tier === "admin") && (
          <QuickLink
            href={`/profile/${session.user.id}`}
            title="Mon profil public"
            desc="Page visible par les autres membres"
          />
        )}
        <QuickLink
          href="/dashboard/settings"
          title="Paramètres"
          desc="Compte, mot de passe, projets"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl border border-anthracite-100 bg-white p-5 hover:shadow-md">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-2xl font-bold text-anthracite">{value}</p>
      <p className="text-sm text-anthracite-500">{label}</p>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  desc,
  accent,
}: {
  href: string;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
        accent ? "border-accent/30 bg-accent-muted" : "border-anthracite-100"
      }`}
    >
      <h3 className="font-semibold text-anthracite">{title}</h3>
      <p className="mt-1 text-sm text-anthracite-500">{desc}</p>
    </Link>
  );
}

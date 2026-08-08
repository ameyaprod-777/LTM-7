import Link from "next/link";
import { Suspense } from "react";
import { Users, Lock, ArrowRight, SearchX } from "lucide-react";
import { getAccessContext } from "@/lib/session";
import { canViewMemberDirectory } from "@/lib/permissions";
import { getOnboardingStatus } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/members/member-card";
import { MembersToolbar } from "@/components/members/members-toolbar";
import { Button } from "@/components/ui/button";
import {
  buildMembersWhere,
  type MembersSearchParams,
} from "@/lib/members-query";
import {
  MembersPagination,
  membersPageSize,
} from "@/components/members/members-pagination";

export const metadata = {
  title: "Membres",
  description: "Découvrez les créatifs de la communauté LoueTonMatos",
};

function ToolbarFallback() {
  return <div className="h-24 animate-pulse rounded-2xl bg-anthracite-100" />;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: MembersSearchParams & { page?: string };
}) {
  const { user, tier } = await getAccessContext();
  const canView = canViewMemberDirectory(tier);
  const isLoggedIn = !!user;

  const onboarding =
    isLoggedIn && tier === "pending" && user?.id
      ? await getOnboardingStatus(user.id)
      : null;

  const where = buildMembersWhere(searchParams);
  const pageSize = membersPageSize();
  const currentPage = Math.max(
    1,
    parseInt(searchParams.page ?? "1", 10) || 1
  );
  const skip = canView ? (currentPage - 1) * pageSize : 0;

  const [members, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: canView ? skip : 0,
      select: {
        id: true,
        name: true,
        image: true,
        city: true,
        creativeDomain: true,
        verifiedIdentity: true,
        kycVerifiedAt: true,
        identityExpiresAt: true,
        bio: true,
        memberSince: true,
        _count: {
          select: {
            listings: { where: { status: "ACTIVE" } },
            services: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: [{ kycVerifiedAt: "desc" }, { memberSince: "desc" }],
      take: canView ? pageSize : 12,
    }),
    prisma.user.count({ where }),
  ]);

  const cardVariant = canView ? "full" : isLoggedIn ? "preview" : "teaser";

  const membersForCards = members.map((m) => ({
    id: m.id,
    name: m.name,
    image: m.image,
    city: m.city,
    creativeDomain: m.creativeDomain,
    verifiedIdentity: m.verifiedIdentity,
    kycVerifiedAt: m.kycVerifiedAt,
    identityExpiresAt: m.identityExpiresAt,
    memberSince: m.memberSince,
    bio: canView ? m.bio : null,
    listingsCount: canView ? m._count.listings : undefined,
    servicesCount: canView ? m._count.services : undefined,
  }));

  return (
    <div>
      <section className="border-b border-anthracite-100 bg-gradient-to-b from-anthracite-50 to-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-muted text-accent">
              <Users className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-anthracite sm:text-4xl">
                La communauté
              </h1>
              <p className="mt-2 max-w-2xl text-anthracite-500">
                {canView
                  ? `${totalCount} créatif${totalCount > 1 ? "s" : ""} validé${totalCount > 1 ? "s" : ""} — consultez leurs profils, annonces et services.`
                  : `${totalCount} membre${totalCount > 1 ? "s" : ""} font déjà confiance à LoueTonMatos. Rejoignez-les pour accéder aux profils complets.`}
              </p>
            </div>
          </div>

          {!canView && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Lock className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                {isLoggedIn
                  ? (onboarding?.message ??
                    "Votre candidature est en cours d'examen. Les profils seront accessibles dès votre validation.")
                  : "Cette section est réservée aux membres validés. Inscrivez-vous pour rejoindre la communauté."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {canView ? (
          <Suspense fallback={<ToolbarFallback />}>
            <MembersToolbar resultCount={totalCount} />
          </Suspense>
        ) : (
          <p className="text-sm font-medium text-anthracite-500">
            Aperçu — {totalCount} membre{totalCount > 1 ? "s" : ""}
          </p>
        )}

        {members.length === 0 ? (
          <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-anthracite-200 py-16 text-center">
            <SearchX className="h-12 w-12 text-anthracite-300" />
            <p className="mt-4 font-medium text-anthracite">Aucun membre trouvé</p>
          </div>
        ) : (
          <div
            className={`mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
              !canView ? "pointer-events-none select-none" : ""
            }`}
          >
            {membersForCards.map((member) => (
              <MemberCard key={member.id} member={member} variant={cardVariant} />
            ))}
          </div>
        )}

        {canView && (
          <MembersPagination
            totalCount={totalCount}
            currentPage={currentPage}
            searchParams={searchParams}
          />
        )}

        {!canView && (
          <div className="mt-12 rounded-2xl border border-anthracite-100 bg-anthracite-900 px-6 py-10 text-center text-white sm:px-12">
            <Lock className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-4 text-xl font-semibold">
              Débloquez l&apos;annuaire des membres
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-anthracite-300">
              Accédez aux profils complets, contactez les créatifs et intégrez un
              réseau de confiance vérifié par notre équipe.
            </p>
            <Link
              href={isLoggedIn ? (onboarding?.href ?? "/apply") : "/register"}
              className="mt-6 inline-block"
            >
              <Button size="lg">
                {isLoggedIn
                  ? (onboarding?.ctaLabel ?? "Compléter ma candidature")
                  : "Rejoindre la communauté"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

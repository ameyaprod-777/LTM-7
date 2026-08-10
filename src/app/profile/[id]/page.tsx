import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessTier, canViewMemberDirectory } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CREATIVE_DOMAIN_LABELS, SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { getUserReviewStats } from "@/lib/review-stats";
import { ReviewList } from "@/components/reviews/review-list";
import { Star, AlertTriangle } from "lucide-react";
import {
  hasVerifiedKycIdentity,
  isIdentityExpired,
} from "@/lib/membership-labels";
import { ContactMemberButton } from "@/components/messages/contact-member-button";
import { VideoThumbnailLink } from "@/components/media/video-thumbnail-link";
import { MAX_PROFILE_PROJECTS, resolveVideoThumbnail } from "@/lib/video-embed";

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const tier = getAccessTier(!!session, session?.user?.role, session?.user?.status);

  const isOwnProfile = session?.user?.id === params.id;
  const profilePath = `/profile/${params.id}`;

  if (!canViewMemberDirectory(tier)) {
    if (!session) {
      redirect(`/register?callbackUrl=${encodeURIComponent(profilePath)}`);
    }
    redirect("/apply?reason=membership-required");
  }
  const canMessage = (tier === "member" || tier === "admin") && !isOwnProfile;

  const user = await prisma.user.findUnique({
    where: isOwnProfile
      ? { id: params.id, status: "ACTIVE" }
      : {
          id: params.id,
          status: "ACTIVE",
          // Profils ADMIN non accessibles publiquement
          role: "MEMBER",
        },
    include: {
      listings: {
        where: { status: "ACTIVE" },
        include: { photos: { take: 1 } },
        take: 12,
      },
      services: {
        where: { status: "ACTIVE" },
        include: { photos: { orderBy: { order: "asc" }, take: 1 } },
        take: 12,
      },
      projects: { orderBy: { createdAt: "desc" } },
      reviewsReceived: {
        where: { flagged: false },
        include: {
          author: { select: { id: true, name: true, image: true } },
          booking: { select: { listing: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) notFound();

  const reviewStats = await getUserReviewStats(params.id);

  const projectsWithThumbs = await Promise.all(
    user.projects.slice(0, MAX_PROFILE_PROJECTS).map(async (p) => {
      if (!p.videoUrl) {
        return {
          ...p,
          href: null as string | null,
          thumbnailUrl: p.coverImage,
          provider: null as null,
        };
      }
      const media = await resolveVideoThumbnail(p.videoUrl);
      return {
        ...p,
        href: media.href,
        thumbnailUrl: media.thumbnailUrl ?? p.coverImage,
        provider: media.provider,
      };
    })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {user.image ? (
          <Image src={user.image} alt="" width={96} height={96} className="rounded-2xl object-cover" unoptimized />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-anthracite-200 text-3xl font-bold">
            {user.name?.[0]}
          </span>
        )}
        <div>
          <h1 className="text-3xl font-bold text-anthracite">{user.name}</h1>
          <p className="text-anthracite-500">
            {user.city}
            {user.creativeDomain && ` · ${CREATIVE_DOMAIN_LABELS[user.creativeDomain]}`}
          </p>
          {user.memberSince && (
            <p className="mt-1 text-sm text-anthracite-400">
              Membre depuis {formatDate(user.memberSince)}
            </p>
          )}
          {reviewStats.reviewCount > 0 && reviewStats.avgRating != null && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-anthracite">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                {reviewStats.avgRating.toFixed(1)} · {reviewStats.reviewCount} avis
                {reviewStats.reviewCount > 20 && " (note globale)"}
              </span>
              {reviewStats.equipmentReviewCount > 0 &&
                reviewStats.avgEquipmentRating != null && (
                  <span className="text-anthracite-500">
                    Matériel {reviewStats.avgEquipmentRating.toFixed(1)} (
                    {reviewStats.equipmentReviewCount})
                  </span>
                )}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {hasVerifiedKycIdentity(user) && (
              <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                Identité vérifiée
              </span>
            )}
            {user.memberSince && (
              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                Membre actif
              </span>
            )}
            {!user.verifiedIdentity &&
              isIdentityExpired(user.identityExpiresAt) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                  <AlertTriangle className="h-3 w-3" />
                  Pièce d&apos;identité expirée
                </span>
              )}
          </div>
          {user.bio && <p className="mt-4 max-w-xl text-anthracite-600">{user.bio}</p>}
          {user.responseRate != null && user.responseRate > 0 && (
            <p className="mt-2 text-sm text-anthracite-500">
              Répond à {Math.round(user.responseRate * 100)} % des messages sous 24 h
              {user.avgResponseTimeMs != null && (
                <> · délai moyen {Math.round(user.avgResponseTimeMs / 3600000)} h</>
              )}
            </p>
          )}
          {canMessage && user.name && (
            <div className="mt-4">
              <ContactMemberButton userId={user.id} userName={user.name} />
            </div>
          )}
        </div>
      </div>

      {projectsWithThumbs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-anthracite">Projets</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {projectsWithThumbs.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-xl border border-anthracite-100"
              >
                {p.href ? (
                  <VideoThumbnailLink
                    href={p.href}
                    title={p.title}
                    thumbnailUrl={p.thumbnailUrl}
                    provider={p.provider}
                  />
                ) : p.thumbnailUrl ? (
                  <div className="relative aspect-video overflow-hidden bg-anthracite-100">
                    <Image
                      src={p.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  {p.href ? (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-anthracite hover:text-accent"
                    >
                      {p.title}
                    </a>
                  ) : (
                    <h3 className="font-semibold text-anthracite">{p.title}</h3>
                  )}
                  {p.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-anthracite-500">
                      {p.description}
                    </p>
                  )}
                  {p.tags.length > 0 && (
                    <p className="mt-2 text-xs text-anthracite-400">
                      {p.tags.join(" · ")}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {user.services.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-anthracite">Services proposés</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.services.map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.id}`}
                className="overflow-hidden rounded-xl border border-anthracite-100 hover:shadow-md"
              >
                <div
                  className="aspect-[4/3] bg-anthracite-100"
                  style={
                    s.photos[0]
                      ? {
                          backgroundImage: `url(${s.photos[0].url})`,
                          backgroundSize: "cover",
                        }
                      : undefined
                  }
                />
                <div className="p-3">
                  <p className="font-medium text-anthracite">{s.title}</p>
                  <p className="text-sm text-anthracite-500">
                    {SERVICE_CATEGORY_LABELS[s.category]} · {formatCents(s.priceAmount)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-anthracite">Annonces actives</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.listings.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="rounded-xl border border-anthracite-100 overflow-hidden hover:shadow-md">
              <div className="aspect-[4/3] bg-anthracite-100" style={l.photos[0] ? { backgroundImage: `url(${l.photos[0].url})`, backgroundSize: "cover" } : undefined} />
              <div className="p-3">
                <p className="font-medium text-anthracite">{l.title}</p>
                <p className="text-sm text-anthracite-500">{formatCents(l.pricePerDay)} / jour</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-anthracite">Avis</h2>
        <div className="mt-4">
          <ReviewList
            reviews={user.reviewsReceived}
            profileUserId={user.id}
            viewerId={session?.user?.id}
          />
        </div>
      </section>
    </div>
  );
}

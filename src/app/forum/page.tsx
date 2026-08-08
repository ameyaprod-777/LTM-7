import Link from "next/link";
import { getAccessContext } from "@/lib/session";
import { canPostForum, canViewForumFeed } from "@/lib/permissions";
import { getOnboardingStatus } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { ForumPostType, ForumSection } from "@prisma/client";
import { FeedPostCard } from "@/components/forum/feed-post-card";
import { QuickPostForm } from "@/components/forum/quick-post-form";
import { ForumFeedToolbar } from "@/components/forum/forum-feed-toolbar";
import { buildForumPostWhere } from "@/lib/forum-query";
import { Button } from "@/components/ui/button";
import { Radio, Megaphone, Lock, ArrowRight } from "lucide-react";

export const metadata = { title: "Fil d'actualité" };

export default async function ForumPage({
  searchParams,
}: {
  searchParams: { type?: string; section?: string; tag?: string; q?: string };
}) {
  const { user, tier } = await getAccessContext();
  const canView = canViewForumFeed(tier);
  const isLoggedIn = !!user;
  const canPost = canPostForum(tier);

  const onboarding =
    isLoggedIn && tier === "pending" && user?.id
      ? await getOnboardingStatus(user.id)
      : null;

  const typeFilter =
    searchParams.type &&
    Object.values(ForumPostType).includes(searchParams.type as ForumPostType)
      ? (searchParams.type as ForumPostType)
      : undefined;

  const sectionFilter =
    searchParams.section &&
    Object.values(ForumSection).includes(searchParams.section as ForumSection)
      ? (searchParams.section as ForumSection)
      : undefined;

  const where = buildForumPostWhere({
    type: typeFilter,
    section: sectionFilter,
    tag: searchParams.tag,
    q: searchParams.q,
  });

  const posts = await prisma.forumPost.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, image: true, city: true },
      },
      _count: { select: { replies: true, reactions: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: canView ? 50 : 8,
  });

  const cardVariant = canView ? "full" : isLoggedIn ? "preview" : "teaser";

  return (
    <div>
      <section className="border-b border-anthracite-100 bg-gradient-to-b from-anthracite-50 to-white py-10 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-3xl">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-muted text-accent">
              <Radio className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-anthracite">
                Fil d&apos;actualité
              </h1>
              <p className="mt-2 text-anthracite-500">
                {canView
                  ? "Projets récents, besoins urgents de matériel et actus de la communauté"
                  : "Découvrez ce que partagent les membres — projets, besoins FX3, urgences tournage…"}
              </p>
            </div>
          </div>

          {!canView && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Lock className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                {isLoggedIn
                  ? (onboarding?.message ??
                    "Votre candidature est en cours d'examen. Le fil complet sera accessible dès votre validation.")
                  : "Le fil d'actualité est réservé aux membres validés. Rejoignez la communauté pour lire et publier."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:max-w-3xl">
        {canPost && (
          <div className="mb-8">
            <QuickPostForm />
          </div>
        )}

        {canView && (
          <ForumFeedToolbar
            typeFilter={typeFilter}
            sectionFilter={sectionFilter}
            tagFilter={searchParams.tag}
            qFilter={searchParams.q}
          />
        )}

        <div
          className={`space-y-5 ${!canView ? "pointer-events-none select-none" : ""}`}
        >
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} variant={cardVariant} />
          ))}

          {posts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-anthracite-200 py-16 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-anthracite-300" />
              <p className="mt-4 font-medium text-anthracite">Aucun résultat</p>
              <p className="mt-1 text-sm text-anthracite-400">
                Essayez d&apos;autres filtres ou publiez la première actu.
              </p>
            </div>
          )}
        </div>

        {!canView && (
          <div className="mt-12 rounded-2xl border border-anthracite-100 bg-anthracite-900 px-6 py-10 text-center text-white sm:px-12">
            <Lock className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-4 text-xl font-semibold">
              Débloquez le fil d&apos;actualité
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-anthracite-300">
              Publiez vos besoins de matériel, partagez vos projets et répondez aux
              urgences de la communauté créative.
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

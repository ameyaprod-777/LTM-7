import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccessContext } from "@/lib/session";
import { canViewForumFeed } from "@/lib/permissions";
import { FORUM_POST_TYPE_LABELS, FORUM_SECTION_LABELS } from "@/lib/forum";
import { canEditForumContent } from "@/lib/forum-query";
import { buildForumUrl } from "@/lib/forum-url";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ThreadView } from "@/components/forum/thread-view";
import { ThreadPostActions } from "@/components/forum/thread-post-actions";
import { ReportPostButton } from "@/components/forum/report-post-button";
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react";
import { ForumPostType } from "@prisma/client";

const TYPE_BADGE: Record<ForumPostType, string> = {
  ACTU: "bg-anthracite-100 text-anthracite-700",
  PROJECT: "bg-violet-100 text-violet-700",
  NEED: "bg-amber-100 text-amber-800",
};

export default async function ForumThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, tier } = await getAccessContext();
  if (!canViewForumFeed(tier)) {
    if (!user) redirect("/register?callbackUrl=/forum/" + params.id);
    redirect("/apply?reason=membership-required");
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, image: true, city: true } },
      replies: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { reactions: true } },
    },
  });

  if (!post) notFound();

  const isAuthor = user?.id === post.authorId;
  const canEdit = isAuthor && canEditForumContent(post.createdAt);

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:max-w-3xl">
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 text-sm text-anthracite-500 hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Fil d&apos;actualité
      </Link>

      {post.coverImage && post.postType === "PROJECT" && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-anthracite-100">
          <Image
            src={post.coverImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="mt-6 flex items-start gap-4">
        <Link href={`/profile/${post.author.id}`}>
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt=""
              width={48}
              height={48}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-anthracite-100 font-bold">
              {post.author.name?.[0]}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_BADGE[post.postType]}`}
            >
              {FORUM_POST_TYPE_LABELS[post.postType]}
            </span>
            <Link
              href={buildForumUrl({ section: post.section })}
              className="rounded-full bg-anthracite-50 px-2.5 py-0.5 text-xs text-anthracite-600 hover:text-accent"
            >
              {FORUM_SECTION_LABELS[post.section]}
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-anthracite sm:text-3xl">
            {post.title}
          </h1>
          <p className="mt-1 text-sm text-anthracite-500">
            <Link href={`/profile/${post.author.id}`} className="hover:text-accent">
              {post.author.name}
            </Link>
            {" · "}
            {formatDate(post.createdAt)}
            {post.editedAt && (
              <span className="text-anthracite-400"> · modifié</span>
            )}
          </p>
        </div>
      </div>

      {user && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canEdit && (
            <ThreadPostActions
              postId={post.id}
              authorId={post.authorId}
              currentUserId={user.id}
              canEdit={canEdit}
              initialTitle={post.title}
              initialBody={post.body}
            />
          )}
          {!isAuthor && <ReportPostButton postId={post.id} />}
        </div>
      )}

      {post.postType === "NEED" && (post.eventAt || post.city) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {post.eventAt && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              <Calendar className="h-5 w-5 shrink-0" />
              {formatDateTime(post.eventAt)}
            </div>
          )}
          {post.city && (
            <div className="flex items-center gap-2 rounded-xl bg-anthracite-50 px-4 py-3 text-sm text-anthracite-700">
              <MapPin className="h-5 w-5 shrink-0" />
              {post.city}
            </div>
          )}
        </div>
      )}

      <div className="prose prose-sm mt-8 max-w-none whitespace-pre-wrap text-anthracite-700">
        {post.body}
      </div>

      {post.projectUrl && (
        <a
          href={post.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 font-medium text-accent hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Voir le projet
        </a>
      )}

      {post.tags.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={buildForumUrl({ tag: t })}
              className="rounded-full bg-anthracite-50 px-2.5 py-0.5 text-sm text-anthracite-600 hover:bg-accent-muted hover:text-accent"
            >
              #{t}
            </Link>
          ))}
        </p>
      )}

      <ThreadView
        postId={post.id}
        locked={post.locked}
        replies={post.replies}
        reactionCount={post._count.reactions}
        currentUserId={user!.id}
      />
    </article>
  );
}

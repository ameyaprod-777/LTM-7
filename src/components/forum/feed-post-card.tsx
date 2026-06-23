import Link from "next/link";
import Image from "next/image";
import {
  Megaphone,
  Clapperboard,
  Search,
  MapPin,
  Calendar,
  MessageCircle,
  ThumbsUp,
  Pin,
  ExternalLink,
  Lock,
} from "lucide-react";
import { ForumPostType, ForumSection } from "@prisma/client";
import { FORUM_POST_TYPE_LABELS, FORUM_SECTION_LABELS } from "@/lib/forum";
import { buildForumUrl } from "@/lib/forum-url";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export type FeedPostData = {
  id: string;
  postType: ForumPostType;
  section: ForumSection;
  title: string;
  body: string;
  city: string | null;
  eventAt: Date | null;
  projectUrl: string | null;
  coverImage: string | null;
  pinned: boolean;
  authorHidden?: boolean;
  tags: string[];
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    city: string | null;
  };
  _count: { replies: number; reactions: number };
};

type Variant = "full" | "teaser" | "preview";

const TYPE_STYLES: Record<
  ForumPostType,
  { icon: typeof Megaphone; badge: string; accent: string }
> = {
  ACTU: {
    icon: Megaphone,
    badge: "bg-anthracite-100 text-anthracite-600",
    accent: "border-l-anthracite-300",
  },
  PROJECT: {
    icon: Clapperboard,
    badge: "bg-violet-100 text-violet-700",
    accent: "border-l-violet-400",
  },
  NEED: {
    icon: Search,
    badge: "bg-amber-100 text-amber-800",
    accent: "border-l-amber-400",
  },
};

export function FeedPostCard({
  post,
  variant = "full",
}: {
  post: FeedPostData;
  variant?: Variant;
}) {
  const style = TYPE_STYLES[post.postType];
  const Icon = style.icon;
  const locked = variant === "teaser" || variant === "preview";
  const excerpt =
    post.body.length > 280 ? `${post.body.slice(0, 280)}…` : post.body;
  const authorLabel = post.authorHidden
    ? "Membre masqué"
    : (post.author.name ?? "Membre");

  const postHref =
    variant === "full"
      ? `/forum/${post.id}`
      : variant === "preview"
        ? "/apply"
        : null;

  const inner = (
    <article
      className={`relative overflow-hidden rounded-2xl border border-anthracite-100 bg-white shadow-sm transition-shadow border-l-4 ${style.accent} ${
        !locked ? "hover:shadow-md" : ""
      }`}
    >
      {postHref && (
        <Link
          href={postHref}
          className="absolute inset-0 z-0 rounded-2xl"
          aria-label={post.title}
        />
      )}
      {variant === "teaser" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-anthracite/30">
          <Lock className="h-8 w-8 text-white drop-shadow" />
        </div>
      )}

      {post.coverImage && post.postType === "PROJECT" && (
        <div className="relative aspect-[21/9] bg-anthracite-100">
          <Image
            src={post.coverImage}
            alt=""
            fill
            className={`object-cover ${variant === "teaser" ? "blur-md scale-105" : ""}`}
            unoptimized
          />
        </div>
      )}

      <div className="relative z-[1] p-5 pointer-events-none">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt=""
                width={44}
                height={44}
                className={`rounded-full object-cover ${variant === "teaser" ? "blur-sm" : ""}`}
                unoptimized
              />
            ) : (
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full bg-anthracite-100 text-sm font-bold text-anthracite ${
                  variant === "teaser" ? "blur-sm" : ""
                }`}
              >
                {post.authorHidden ? "?" : (post.author.name?.[0] ?? "?")}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}
              >
                <Icon className="h-3 w-3" />
                {FORUM_POST_TYPE_LABELS[post.postType]}
              </span>
              <span className="rounded-full bg-anthracite-50 px-2 py-0.5 text-xs text-anthracite-500">
                {FORUM_SECTION_LABELS[post.section]}
              </span>
              {post.pinned && <Pin className="h-3.5 w-3.5 text-accent" />}
              <span className="text-xs text-anthracite-400">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <p
              className={`text-sm font-medium text-anthracite ${
                locked ? "blur-[4px] select-none" : ""
              }`}
            >
              {authorLabel}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h2
            className={`text-lg font-semibold text-anthracite ${
              locked ? "blur-[4px] select-none" : ""
            }`}
          >
            {post.title}
          </h2>

          {post.postType === "NEED" && (post.eventAt || post.city) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.eventAt && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 ${
                    variant === "teaser" ? "blur-[3px] select-none" : ""
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(post.eventAt)}
                </span>
              )}
              {post.city && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg bg-anthracite-50 px-3 py-1.5 text-sm text-anthracite-600 ${
                    variant === "teaser" ? "blur-[2px] select-none" : ""
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  {post.city}
                </span>
              )}
            </div>
          )}

          <p
            className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed text-anthracite-600 ${
              locked ? "blur-[4px] select-none" : ""
            }`}
          >
            {excerpt}
          </p>
        </div>

        {post.projectUrl && post.postType === "PROJECT" && !locked && (
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
            <ExternalLink className="h-4 w-4" />
            Voir le projet
          </span>
        )}

        {variant === "preview" && (
          <p className="mt-3 text-xs text-anthracite-400">
            Contenu complet après validation de votre adhésion
          </p>
        )}

        {post.tags.length > 0 && !locked && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={buildForumUrl({ tag })}
                className="pointer-events-auto relative z-10 rounded-full bg-anthracite-50 px-2 py-0.5 text-xs text-anthracite-600 hover:bg-accent-muted hover:text-accent"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {!locked && (
          <div className="mt-4 flex items-center gap-4 border-t border-anthracite-50 pt-4 text-sm text-anthracite-500">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {post._count.reactions}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post._count.replies} commentaire{post._count.replies !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </article>
  );

  return <div className="relative block">{inner}</div>;
}

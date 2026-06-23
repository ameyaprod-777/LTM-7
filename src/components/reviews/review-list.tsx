import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { ReportReviewButton } from "@/components/reviews/report-review-button";
import { ReviewResponseForm } from "@/components/reviews/review-response-form";

export type ReviewListItem = {
  id: string;
  rating: number;
  comment: string | null;
  equipmentRating: number | null;
  equipmentComment: string | null;
  response: string | null;
  responseAt: Date | string | null;
  createdAt: Date | string;
  author: { id: string; name: string | null; image: string | null };
  booking: { listing: { title: string } | null };
};

function Stars({ count }: { count: number }) {
  return <span className="text-accent">{"★".repeat(count)}</span>;
}

export function ReviewList({
  reviews,
  profileUserId,
  viewerId,
}: {
  reviews: ReviewListItem[];
  profileUserId: string;
  viewerId?: string;
}) {
  const isProfileOwner = viewerId === profileUserId;

  if (reviews.length === 0) {
    return <p className="text-sm text-anthracite-400">Aucun avis pour le moment.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const canReport = viewerId === profileUserId && viewerId !== r.author.id;
        const canRespond = isProfileOwner;

        return (
          <blockquote
            key={r.id}
            className="rounded-xl border border-anthracite-100 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {r.author.image ? (
                  <Image
                    src={r.author.image}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-anthracite-100 text-xs font-bold">
                    {r.author.name?.[0] ?? "?"}
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-anthracite">
                    {r.author.name ?? "Membre"}
                  </p>
                  <p className="text-xs text-anthracite-400">
                    {r.booking.listing?.title ?? "Location"} ·{" "}
                    {formatDate(r.createdAt)}
                  </p>
                </div>
              </div>
              {canReport && <ReportReviewButton reviewId={r.id} />}
            </div>

            <div className="mt-3 space-y-2">
              <div>
                <p className="text-xs font-medium text-anthracite-500">Personne</p>
                <p className="mt-0.5">
                  <Stars count={r.rating} />
                </p>
                {r.comment && (
                  <p className="mt-1 text-sm text-anthracite-600">{r.comment}</p>
                )}
              </div>

              {r.equipmentRating != null && (
                <div>
                  <p className="text-xs font-medium text-anthracite-500">Matériel</p>
                  <p className="mt-0.5">
                    <Stars count={r.equipmentRating} />
                  </p>
                  {r.equipmentComment && (
                    <p className="mt-1 text-sm text-anthracite-600">
                      {r.equipmentComment}
                    </p>
                  )}
                </div>
              )}
            </div>

            {r.response && !canRespond && (
              <div className="mt-3 rounded-lg bg-anthracite-50 px-3 py-2 text-sm text-anthracite-700">
                <p className="text-xs font-medium text-anthracite-500">
                  Réponse du membre
                </p>
                <p className="mt-1 whitespace-pre-wrap">{r.response}</p>
              </div>
            )}

            {canRespond && (
              <ReviewResponseForm reviewId={r.id} initialResponse={r.response} />
            )}
          </blockquote>
        );
      })}
    </div>
  );
}

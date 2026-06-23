import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import type { ListingCategory } from "@prisma/client";

export type ListingCardData = {
  id: string;
  title: string;
  city: string;
  pricePerDay: number;
  category: ListingCategory | string;
  photos: { url: string }[];
};

type Variant = "full" | "teaser" | "preview";

export function ListingCard({
  listing,
  variant = "full",
}: {
  listing: ListingCardData;
  variant?: Variant;
}) {
  const photo = listing.photos[0]?.url;
  const categoryLabel =
    CATEGORY_LABELS[listing.category as ListingCategory] ?? listing.category;

  const inner = (
    <article className="group overflow-hidden rounded-2xl border border-anthracite-100 bg-white transition-shadow hover:border-accent/20 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-anthracite-100">
        {photo ? (
          <Image
            src={photo}
            alt={`Photo : ${listing.title}`}
            fill
            className={`object-cover transition-transform group-hover:scale-105 ${
              variant === "teaser" ? "blur-md scale-110" : ""
            }`}
            unoptimized
          />
        ) : null}
        {variant === "teaser" && (
          <div className="absolute inset-0 flex items-center justify-center bg-anthracite/50">
            <Lock className="h-8 w-8 text-white" />
          </div>
        )}
        {variant === "preview" && (
          <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-anthracite shadow">
            En attente
          </span>
        )}
      </div>
      <div className="p-4">
        <span className="inline-block rounded-full bg-anthracite-50 px-2 py-0.5 text-xs font-medium text-anthracite-500">
          {categoryLabel}
        </span>
        <p
          className={`mt-2 line-clamp-2 font-semibold leading-snug text-anthracite ${
            variant === "teaser" ? "blur-[4px] select-none" : ""
          }`}
        >
          {listing.title}
        </p>
        <p
          className={`mt-1 text-sm text-anthracite-400 ${
            variant === "teaser" ? "blur-[3px] select-none" : ""
          }`}
        >
          {listing.city}
        </p>
        {variant === "full" && (
          <p className="mt-2 font-medium text-accent">
            {formatCents(listing.pricePerDay)} / jour
          </p>
        )}
        {variant === "preview" && (
          <p className="mt-2 text-sm text-anthracite-400">
            Prix visible après validation
          </p>
        )}
      </div>
    </article>
  );

  if (variant === "full") {
    return <Link href={`/listings/${listing.id}`}>{inner}</Link>;
  }

  if (variant === "preview") {
    return <Link href="/apply">{inner}</Link>;
  }

  return <div className="relative">{inner}</div>;
}

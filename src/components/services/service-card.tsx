import Link from "next/link";
import Image from "next/image";
import { Lock, User } from "lucide-react";
import {
  SERVICE_CATEGORY_LABELS,
  SERVICE_RATE_LABELS,
} from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { toSameOriginMediaUrl } from "@/lib/upload-root";
import type { ServiceCategory, ServiceRateType } from "@prisma/client";

export type ServiceCardData = {
  id: string;
  title: string;
  city: string;
  priceAmount: number;
  rateType: ServiceRateType;
  category: ServiceCategory | string;
  photos: { url: string }[];
  owner?: { name: string | null; image: string | null };
};

type Variant = "full" | "teaser" | "preview";

export function ServiceCard({
  service,
  variant = "full",
}: {
  service: ServiceCardData;
  variant?: Variant;
}) {
  const photo = toSameOriginMediaUrl(service.photos[0]?.url);
  const categoryLabel =
    SERVICE_CATEGORY_LABELS[service.category as ServiceCategory] ??
    service.category;
  const rateLabel = SERVICE_RATE_LABELS[service.rateType as ServiceRateType];

  const inner = (
    <article className="group overflow-hidden rounded-2xl border border-anthracite-100 bg-white transition-shadow hover:border-accent/20 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-anthracite-800 to-anthracite-900">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            className={`object-cover transition-transform group-hover:scale-105 ${
              variant === "teaser" ? "blur-md scale-110" : ""
            }`}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <User className="h-16 w-16 text-white/20" />
          </div>
        )}
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
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-anthracite shadow-sm">
          Service
        </span>
      </div>
      <div className="p-4">
        <span className="inline-block rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
          {categoryLabel}
        </span>
        <p
          className={`mt-2 line-clamp-2 font-semibold leading-snug text-anthracite ${
            variant === "teaser" ? "blur-[4px] select-none" : ""
          }`}
        >
          {service.title}
        </p>
        <p
          className={`mt-1 text-sm text-anthracite-400 ${
            variant === "teaser" ? "blur-[3px] select-none" : ""
          }`}
        >
          {service.city}
          {service.owner?.name && ` · ${service.owner.name}`}
        </p>
        {variant === "full" && (
          <p className="mt-2 font-medium text-accent">
            {formatCents(service.priceAmount)} {rateLabel}
          </p>
        )}
        {variant === "preview" && (
          <p className="mt-2 text-sm text-anthracite-400">
            Tarif visible après validation
          </p>
        )}
      </div>
    </article>
  );

  if (variant === "full") {
    return <Link href={`/services/${service.id}`}>{inner}</Link>;
  }
  if (variant === "preview") {
    return <Link href="/apply">{inner}</Link>;
  }
  return <div className="relative">{inner}</div>;
}

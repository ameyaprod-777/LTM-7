import Link from "next/link";
import Image from "next/image";
import { Lock, BadgeCheck, MapPin, Package, Briefcase, UserCheck } from "lucide-react";
import { CREATIVE_DOMAIN_LABELS } from "@/lib/constants";
import { hasVerifiedKycIdentity } from "@/lib/membership-labels";
import type { CreativeDomain } from "@prisma/client";

export type MemberCardData = {
  id: string;
  name: string | null;
  image: string | null;
  city: string | null;
  creativeDomain: CreativeDomain | null;
  verifiedIdentity?: boolean;
  kycVerifiedAt: Date | string | null;
  identityExpiresAt?: Date | string | null;
  memberSince: Date | string | null;
  bio: string | null;
  listingsCount?: number;
  servicesCount?: number;
};

type Variant = "full" | "teaser" | "preview";

export function MemberCard({
  member,
  variant = "full",
}: {
  member: MemberCardData;
  variant?: Variant;
}) {
  const domainLabel = member.creativeDomain
    ? CREATIVE_DOMAIN_LABELS[member.creativeDomain]
    : null;
  const locked = variant === "teaser" || variant === "preview";
  const identityVerified = hasVerifiedKycIdentity({
    verifiedIdentity: member.verifiedIdentity,
    kycVerifiedAt: member.kycVerifiedAt
      ? new Date(member.kycVerifiedAt)
      : null,
    identityExpiresAt: member.identityExpiresAt
      ? new Date(member.identityExpiresAt)
      : null,
  });
  const isActiveMember = !!member.memberSince;

  const inner = (
    <article className="group overflow-hidden rounded-2xl border border-anthracite-100 bg-white transition-shadow hover:border-accent/20 hover:shadow-lg">
      <div className="relative flex items-center gap-4 p-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-anthracite-100">
          {member.image ? (
            <Image
              src={member.image}
              alt=""
              fill
              className={`object-cover ${variant === "teaser" ? "blur-md scale-110" : ""}`}
              unoptimized
            />
          ) : (
            <span
              className={`flex h-full w-full items-center justify-center text-xl font-bold text-anthracite-400 ${
                variant === "teaser" ? "blur-sm" : ""
              }`}
            >
              {member.name?.[0] ?? "?"}
            </span>
          )}
          {variant === "teaser" && (
            <div className="absolute inset-0 flex items-center justify-center bg-anthracite/40">
              <Lock className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`flex flex-wrap items-center gap-1 font-semibold text-anthracite ${
              locked ? "blur-[4px] select-none" : ""
            }`}
          >
            {member.name ?? "Membre"}
            {!locked && identityVerified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-blue-600"
                aria-label="Identité vérifiée"
              />
            )}
            {!locked && isActiveMember && (
              <UserCheck
                className="h-4 w-4 shrink-0 text-accent"
                aria-label="Membre actif"
              />
            )}
          </p>
          {domainLabel && (
            <p
              className={`mt-0.5 text-sm text-accent ${
                locked ? "blur-[3px] select-none" : ""
              }`}
            >
              {domainLabel}
            </p>
          )}
          {member.city && (
            <p
              className={`mt-1 flex items-center gap-1 text-sm text-anthracite-400 ${
                variant === "teaser" ? "blur-[2px] select-none" : ""
              }`}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {member.city}
            </p>
          )}
          {!locked && member.bio && (
            <p className="mt-2 line-clamp-2 text-sm text-anthracite-500">
              {member.bio}
            </p>
          )}
          {!locked &&
            (member.listingsCount !== undefined ||
              member.servicesCount !== undefined) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-anthracite-400">
                {member.listingsCount !== undefined &&
                  member.listingsCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {member.listingsCount} annonce
                      {member.listingsCount > 1 ? "s" : ""}
                    </span>
                  )}
                {member.servicesCount !== undefined &&
                  member.servicesCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {member.servicesCount} service
                      {member.servicesCount > 1 ? "s" : ""}
                    </span>
                  )}
              </div>
            )}
          {variant === "preview" && (
            <p className="mt-2 text-xs text-anthracite-400">
              Profil complet après validation
            </p>
          )}
        </div>
      </div>
    </article>
  );

  if (variant === "full") {
    return <Link href={`/profile/${member.id}`}>{inner}</Link>;
  }
  if (variant === "preview") {
    return <Link href="/apply">{inner}</Link>;
  }
  return <div>{inner}</div>;
}

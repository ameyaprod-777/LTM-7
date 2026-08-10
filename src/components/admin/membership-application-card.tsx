import Image from "next/image";
import Link from "next/link";
import {
  Settings2,
  ExternalLink,
  Globe,
  AtSign,
  Briefcase,
  MailCheck,
  MailWarning,
} from "lucide-react";
import type { ApplicationStatus, CreativeDomain } from "@prisma/client";
import { CREATIVE_DOMAIN_LABELS } from "@/lib/validations/membership";
import { formatDate } from "@/lib/utils";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
} from "@/lib/membership-labels";
import { MembershipActions } from "@/components/admin/membership-actions";
import { IdentityVerificationPanel } from "@/components/admin/kyc-documents-list";

type Project = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  videoUrl?: string | null;
  tags: string[];
};

type ApplicationCardProps = {
  app: {
    id: string;
    status: ApplicationStatus;
    motivation: string;
    adminMessage: string | null;
    adminNotes: string | null;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
      emailVerified: Date | null;
      image: string | null;
      city: string | null;
      bio: string | null;
      creativeDomain: CreativeDomain | null;
      portfolioUrl: string | null;
      websiteUrl: string | null;
      instagramUrl: string | null;
      verifiedIdentity: boolean;
      kycVerifiedAt: Date | null;
      stripeIdentityVerificationId: string | null;
      stripeIdentityStatus: string | null;
      stripeIdentityLastError: string | null;
      projects: Project[];
    };
    invitation: {
      createdBy: { id: string; name: string | null; email: string };
    } | null;
  };
};

export function MembershipApplicationCard({ app }: ApplicationCardProps) {
  const readOnly = !["PENDING", "INCOMPLETE"].includes(app.status);
  const { user } = app;

  const externalLinks = [
    user.portfolioUrl && {
      href: user.portfolioUrl,
      label: "Portfolio",
      icon: Briefcase,
    },
    user.websiteUrl && {
      href: user.websiteUrl,
      label: "Site web",
      icon: Globe,
    },
    user.instagramUrl && {
      href: user.instagramUrl.startsWith("http")
        ? user.instagramUrl
        : `https://instagram.com/${user.instagramUrl.replace(/^@/, "")}`,
      label: "Instagram",
      icon: AtSign,
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[];

  return (
    <article className="rounded-2xl border border-anthracite-100 bg-white p-6">
      {/* Bandeau statut + certifications */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${APPLICATION_STATUS_STYLES[app.status]}`}
        >
          {APPLICATION_STATUS_LABELS[app.status]}
        </span>
        {user.emailVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-800">
            <MailCheck className="h-3 w-3" />
            Email vérifié
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800">
            <MailWarning className="h-3 w-3" />
            Email non vérifié
          </span>
        )}
        {user.verifiedIdentity && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Identité Stripe vérifiée
          </span>
        )}
      </div>

      {/* Identité candidat */}
      <div className="flex items-start gap-4">
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={56}
            height={56}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-anthracite-100 text-lg font-bold text-anthracite">
            {user.name?.[0] ?? "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-anthracite">
            {user.name ?? "Sans nom"}
          </h2>
          <p className="truncate text-sm text-anthracite-500">{user.email}</p>
          <p className="mt-1 text-sm text-anthracite-400">
            {user.city ?? "—"}
            {user.creativeDomain &&
              ` · ${CREATIVE_DOMAIN_LABELS[user.creativeDomain]}`}
          </p>
        </div>
        <time className="shrink-0 text-xs text-anthracite-400">
          {formatDate(app.createdAt)}
        </time>
      </div>

      {app.invitation && (
        <p className="mt-3 rounded-lg bg-accent-muted px-3 py-2 text-xs text-anthracite">
          Invité via lien par{" "}
          <Link
            href={`/admin/users/${app.invitation.createdBy.id}`}
            className="font-semibold text-accent hover:underline"
          >
            {app.invitation.createdBy.name ?? app.invitation.createdBy.email}
          </Link>
        </p>
      )}

      {app.adminMessage && (
        <p className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
          <span className="font-medium">Message admin :</span>{" "}
          {app.adminMessage}
        </p>
      )}

      {/* Bio & motivation */}
      {user.bio && (
        <p className="mt-4 whitespace-pre-line text-sm text-anthracite-600">
          {user.bio}
        </p>
      )}
      <blockquote className="mt-3 border-l-2 border-accent pl-4 text-sm italic text-anthracite-500">
        {app.motivation}
      </blockquote>

      {/* Liens externes */}
      {externalLinks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-anthracite-200 bg-anthracite-50 px-3 py-1.5 text-xs font-medium text-anthracite-700 hover:border-accent hover:text-accent"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}

      {/* Projets récents */}
      {user.projects.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-anthracite-500">
            Projets récents
          </h3>
          <ul className="mt-2 space-y-2">
            {user.projects.map((project) => (
              <li
                key={project.id}
                className="rounded-lg border border-anthracite-100 bg-anthracite-50/50 p-3"
              >
                <p className="text-sm font-medium text-anthracite">
                  {project.title}
                </p>
                {project.description && (
                  <p className="mt-1 text-xs text-anthracite-500">
                    {project.description}
                  </p>
                )}
                {project.videoUrl && (
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-accent hover:underline"
                  >
                    Voir la vidéo
                  </a>
                )}
                {project.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white px-2 py-0.5 text-[10px] text-anthracite-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Vérification Stripe Identity */}
      <IdentityVerificationPanel
        verifiedIdentity={user.verifiedIdentity}
        verifiedAt={user.kycVerifiedAt}
        stripeStatus={user.stripeIdentityStatus}
        stripeLastError={user.stripeIdentityLastError}
        stripeVerificationId={user.stripeIdentityVerificationId}
      />

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-4 border-t border-anthracite-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href={`/admin/users/${user.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          <Settings2 className="h-4 w-4" />
          Gérer le profil
        </Link>
        <div className="min-w-0 flex-1 sm:max-w-md">
          <MembershipActions
            applicationId={app.id}
            status={app.status}
            initialAdminNotes={app.adminNotes}
            readOnly={readOnly}
          />
        </div>
      </div>
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Settings2, AlertTriangle } from "lucide-react";
import type { ApplicationStatus, CreativeDomain, KycDocument } from "@prisma/client";
import { CREATIVE_DOMAIN_LABELS } from "@/lib/validations/membership";
import { formatDate } from "@/lib/utils";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  isIdentityExpired,
} from "@/lib/membership-labels";
import { MembershipActions } from "@/components/admin/membership-actions";
import { KycDocumentsList } from "@/components/admin/kyc-documents-list";

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
      image: string | null;
      city: string | null;
      bio: string | null;
      creativeDomain: CreativeDomain | null;
      identityExpiresAt: Date | null;
      kycVerifiedAt: Date | null;
    };
    kycDocuments: KycDocument[];
    invitation: {
      createdBy: { name: string | null };
    } | null;
  };
};

export function MembershipApplicationCard({ app }: ApplicationCardProps) {
  const identityExpired = isIdentityExpired(app.user.identityExpiresAt);
  const readOnly = !["PENDING", "INCOMPLETE"].includes(app.status);

  return (
    <article className="rounded-2xl border border-anthracite-100 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${APPLICATION_STATUS_STYLES[app.status]}`}
        >
          {APPLICATION_STATUS_LABELS[app.status]}
        </span>
        {app.user.kycVerifiedAt && app.status === "APPROVED" && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Identité vérifiée
          </span>
        )}
        {identityExpired && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <AlertTriangle className="h-3 w-3" />
            Pièce expirée
          </span>
        )}
        {app.user.identityExpiresAt && !identityExpired && (
          <span className="text-xs text-anthracite-400">
            Expire le {formatDate(app.user.identityExpiresAt)}
          </span>
        )}
      </div>

      <div className="flex items-start gap-4">
        {app.user.image ? (
          <Image
            src={app.user.image}
            alt=""
            width={56}
            height={56}
            className="rounded-full object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-anthracite-100 text-lg font-bold text-anthracite">
            {app.user.name?.[0] ?? "?"}
          </span>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-anthracite">{app.user.name}</h2>
          <p className="text-sm text-anthracite-500">{app.user.email}</p>
          <p className="mt-1 text-sm text-anthracite-400">
            {app.user.city}
            {app.user.creativeDomain &&
              ` · ${CREATIVE_DOMAIN_LABELS[app.user.creativeDomain]}`}
          </p>
        </div>
        <time className="text-xs text-anthracite-400">
          {formatDate(app.createdAt)}
        </time>
      </div>

      {app.invitation && (
        <p className="mt-3 rounded-lg bg-accent-muted px-3 py-2 text-xs text-anthracite">
          Invité par {app.invitation.createdBy.name ?? "un membre"}
        </p>
      )}

      {app.adminMessage && (
        <p className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
          <span className="font-medium">Message admin :</span> {app.adminMessage}
        </p>
      )}

      <p className="mt-4 text-sm text-anthracite-600">{app.user.bio}</p>
      <blockquote className="mt-3 border-l-2 border-accent pl-4 text-sm italic text-anthracite-500">
        {app.motivation}
      </blockquote>

      <KycDocumentsList documents={app.kycDocuments} />

      <div className="mt-6 flex flex-col gap-4 border-t border-anthracite-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href={`/admin/users/${app.user.id}`}
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

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import type { ApplicationStatus, Prisma } from "@prisma/client";
import { isStaffRole } from "@/lib/staff";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipStatusTabs } from "@/components/admin/membership-status-tabs";
import { MembershipApplicationCard } from "@/components/admin/membership-application-card";
import { APPLICATION_STATUS_LABELS } from "@/lib/membership-labels";

export const metadata = { title: "Candidatures" };

const STATUS_MAP: Record<string, ApplicationStatus | undefined> = {
  pending: "PENDING",
  incomplete: "INCOMPLETE",
  approved: "APPROVED",
  rejected: "REJECTED",
  all: undefined,
};

function TabsFallback() {
  return (
    <div className="mt-6 h-12 animate-pulse rounded-lg bg-anthracite-100" />
  );
}

export default async function AdminMembershipPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/");
  }

  const tabKey = searchParams.status ?? "pending";
  const statusFilter =
    tabKey in STATUS_MAP ? STATUS_MAP[tabKey] : STATUS_MAP.pending;

  const where: Prisma.MembershipApplicationWhereInput = statusFilter
    ? { status: statusFilter }
    : {};

  const [applications, pending, incomplete, approved, rejected, total] =
    await Promise.all([
      prisma.membershipApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              image: true,
              city: true,
              bio: true,
              creativeDomain: true,
              portfolioUrl: true,
              websiteUrl: true,
              instagramUrl: true,
              verifiedIdentity: true,
              kycVerifiedAt: true,
              stripeIdentityVerificationId: true,
              stripeIdentityStatus: true,
              stripeIdentityLastError: true,
              projects: {
                take: 3,
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  coverImage: true,
                  videoUrl: true,
                  tags: true,
                },
              },
            },
          },
          invitation: {
            include: {
              createdBy: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.membershipApplication.count({ where: { status: "PENDING" } }),
      prisma.membershipApplication.count({ where: { status: "INCOMPLETE" } }),
      prisma.membershipApplication.count({ where: { status: "APPROVED" } }),
      prisma.membershipApplication.count({ where: { status: "REJECTED" } }),
      prisma.membershipApplication.count(),
    ]);

  const counts = {
    pending,
    incomplete,
    approved,
    rejected,
    all: total,
  };

  const emptyLabel =
    tabKey === "all"
      ? "Aucune candidature."
      : statusFilter
        ? `Aucune candidature ${APPLICATION_STATUS_LABELS[statusFilter].toLowerCase()}.`
        : "Aucune candidature.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-anthracite">Candidatures</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Historique et traitement des demandes d&apos;adhésion
      </p>

      <Suspense fallback={<TabsFallback />}>
        <MembershipStatusTabs counts={counts} />
      </Suspense>

      <p className="mt-4 text-sm text-anthracite-500">
        {applications.length} résultat{applications.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-6 space-y-6">
        {applications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-anthracite-200 py-12 text-center text-anthracite-500">
            {emptyLabel}
          </p>
        ) : (
          applications.map((app) => (
            <MembershipApplicationCard key={app.id} app={app} />
          ))
        )}
      </div>
    </div>
  );
}

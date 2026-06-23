import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/staff";
import { AdminUserEditForm } from "@/components/admin/user-edit-form";

export const metadata = { title: "Gérer l'utilisateur" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      application: {
        include: {
          reviewedBy: { select: { name: true } },
        },
      },
      _count: {
        select: {
          listings: true,
          bookingsAsRenter: true,
          bookingsAsLister: true,
          reviewsReceived: true,
        },
      },
    },
  });

  if (!user) notFound();

  if (user.email.endsWith("@louetonmatos.invalid")) {
    redirect("/admin/users");
  }

  const serialized = {
    ...user,
    memberSince: user.memberSince?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    application: user.application
      ? {
          ...user.application,
          createdAt: user.application.createdAt.toISOString(),
          reviewedAt: user.application.reviewedAt?.toISOString() ?? null,
        }
      : null,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Gérer le profil</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Modifiez les données, le rôle, le statut et la certification d&apos;identité.
      </p>
      <div className="mt-8">
        <AdminUserEditForm
          user={serialized}
          currentAdminId={session.user.id}
        />
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { isStaffRole } from "@/lib/staff";
import { BadgeCheck, Settings2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/validations/admin-user";
import { Suspense } from "react";
import { AdminUsersFilters } from "@/components/admin/users-filters";
import type { UserRole, UserStatus } from "@prisma/client";

export const metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; status?: string; certified?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/login?callbackUrl=/admin/users");

  const q = searchParams.q?.trim();
  const role = searchParams.role as UserRole | undefined;
  const status = searchParams.status as UserStatus | undefined;
  const certifiedOnly = searchParams.certified === "1";

  const users = await prisma.user.findMany({
    where: {
      NOT: { email: { endsWith: "@louetonmatos.invalid" } },
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(certifiedOnly ? { verifiedIdentity: true } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      status: true,
      city: true,
      verifiedIdentity: true,
      application: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Profils & membres</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        {users.length} utilisateur{users.length !== 1 ? "s" : ""} — cliquez sur{" "}
        <strong>Gérer le profil</strong> pour modifier données, rôle et certification.
      </p>

      <Suspense fallback={<p className="mt-6 text-sm text-anthracite-400">Chargement…</p>}>
        <AdminUsersFilters />
      </Suspense>

      {/* Vue mobile : cartes */}
      <ul className="mt-6 space-y-3 md:hidden">
        {users.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-anthracite-100 bg-white p-4 shadow-sm"
          >
            <UserRow user={u} mobile />
            <Link
              href={`/admin/users/${u.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              <Settings2 className="h-4 w-4" />
              Gérer le profil
            </Link>
          </li>
        ))}
        {users.length === 0 && (
          <li className="py-8 text-center text-anthracite-400">Aucun utilisateur trouvé.</li>
        )}
      </ul>

      {/* Vue desktop : tableau */}
      <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-anthracite-100 bg-white md:block">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-anthracite-50 text-anthracite-500">
            <tr>
              <th className="px-4 py-3 font-medium">Membre</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Certifié</th>
              <th className="sticky right-0 bg-anthracite-50 px-4 py-3 font-medium shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-anthracite-50 hover:bg-anthracite-50/50">
                <td className="px-4 py-3">
                  <UserRow user={u} />
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3">
                  {u.verifiedIdentity ? (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <BadgeCheck className="h-4 w-4" />
                      Oui
                    </span>
                  ) : (
                    <span className="text-anthracite-400">Non</span>
                  )}
                </td>
                <td className="sticky right-0 bg-white px-4 py-3 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
                  >
                    <Settings2 className="h-4 w-4" />
                    Gérer le profil
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="py-12 text-center text-anthracite-400">Aucun utilisateur trouvé.</p>
        )}
      </div>
    </div>
  );
}

type UserRowData = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  city: string | null;
  verifiedIdentity: boolean;
  application: { status: string } | null;
};

function UserRow({ user: u, mobile }: { user: UserRowData; mobile?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {u.image ? (
        <Image
          src={u.image}
          alt=""
          width={mobile ? 48 : 36}
          height={mobile ? 48 : 36}
          className="rounded-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className={`flex items-center justify-center rounded-full bg-anthracite-200 font-bold text-anthracite ${mobile ? "h-12 w-12 text-lg" : "h-9 w-9 text-xs"}`}
        >
          {u.name?.[0] ?? "?"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-anthracite">{u.name ?? "—"}</p>
        <p className="truncate text-xs text-anthracite-400">{u.email}</p>
        {mobile && (
          <div className="mt-2 flex flex-wrap gap-2">
            <RoleBadge role={u.role} />
            <StatusBadge status={u.status} />
          </div>
        )}
        {u.city && <p className="text-xs text-anthracite-400">{u.city}</p>}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    MEMBER: "bg-green-100 text-green-800",
    MODERATOR: "bg-violet-100 text-violet-800",
    ADMIN: "bg-anthracite-200 text-anthracite-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[role]}`}>
      {USER_ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    SUSPENDED: "bg-amber-50 text-amber-700",
    BANNED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {USER_STATUS_LABELS[status]}
    </span>
  );
}

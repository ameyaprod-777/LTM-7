import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/staff";
import { AdminListingsTable } from "@/components/admin/admin-listings-table";
import type { ListingStatus } from "@prisma/client";

export const metadata = { title: "Modération annonces" };

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/");

  const status = searchParams.status as ListingStatus | undefined;
  const q = searchParams.q?.trim();

  const listings = await prisma.listing.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { bookings: true, reports: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Modération des annonces</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Activer, mettre en pause ou masquer les annonces signalées.
      </p>

      <form className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher…"
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">En pause</option>
          <option value="DRAFT">Brouillon</option>
          <option value="REMOVED">Masquée</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </form>

      <AdminListingsTable listings={listings} />
    </div>
  );
}

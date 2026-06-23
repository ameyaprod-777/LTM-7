import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/staff";
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table";
import type { BookingStatus } from "@prisma/client";

export const metadata = { title: "Réservations — Admin" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/");

  const status = searchParams.status as BookingStatus | undefined;
  const q = searchParams.q?.trim();

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { listing: { title: { contains: q, mode: "insensitive" } } },
              { renter: { email: { contains: q, mode: "insensitive" } } },
              { lister: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      listing: { select: { id: true, title: true } },
      renter: { select: { id: true, name: true, email: true } },
      lister: { select: { id: true, name: true, email: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Réservations</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Vue globale, statuts de paiement et actions manuelles.
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
          <option value="PENDING">En attente</option>
          <option value="CONFIRMED">Confirmée</option>
          <option value="ACTIVE">En cours</option>
          <option value="COMPLETED">Terminée</option>
          <option value="CANCELLED">Annulée</option>
          <option value="DISPUTED">Litige</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </form>

      <AdminBookingsTable
        bookings={bookings.map((b) => ({
          ...b,
          startDate: b.startDate.toISOString(),
          endDate: b.endDate.toISOString(),
        }))}
      />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/ticket";
import type { TicketCategory, TicketStatus } from "@prisma/client";

export const metadata = { title: "Tickets support" };

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    category?: string;
    assignedToId?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/");

  const status = searchParams.status as TicketStatus | undefined;
  const category = searchParams.category as TicketCategory | undefined;

  const agents = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MODERATOR"] }, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(searchParams.assignedToId === "unassigned"
        ? { assignedToId: null }
        : searchParams.assignedToId
          ? { assignedToId: searchParams.assignedToId }
          : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      booking: { select: { listing: { select: { title: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Tickets support</h1>

      <form className="mt-6 flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        >
          <option value="">Tous statuts</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        >
          <option value="">Toutes catégories</option>
          {Object.entries(TICKET_CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          name="assignedToId"
          defaultValue={searchParams.assignedToId ?? ""}
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        >
          <option value="">Tous agents</option>
          <option value="unassigned">Non assignés</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name ?? a.id}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </form>

      <ul className="mt-8 space-y-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              href={`/admin/tickets/${t.id}`}
              className="block rounded-xl border border-anthracite-100 p-4 hover:bg-anthracite-50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-anthracite">{t.subject}</span>
                <span className="rounded-full bg-anthracite-100 px-2 py-0.5 text-xs">
                  {TICKET_STATUS_LABELS[t.status]}
                </span>
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                  {TICKET_CATEGORY_LABELS[t.category]}
                </span>
                {t.priority !== "NORMAL" && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                    {TICKET_PRIORITY_LABELS[t.priority]}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-anthracite-500">
                {t.user.name ?? t.user.email}
                {t.assignedTo && ` · ${t.assignedTo.name}`}
                {t.booking && ` · ${t.booking.listing.title}`}
              </p>
            </Link>
          </li>
        ))}
        {tickets.length === 0 && (
          <p className="text-anthracite-400">Aucun ticket.</p>
        )}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { AdminTicketPanel } from "@/components/admin/admin-ticket-panel";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/ticket";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar } from "lucide-react";

export default async function AdminTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      booking: {
        select: {
          id: true,
          status: true,
          startDate: true,
          listing: { select: { id: true, title: true } },
        },
      },
      listing: { select: { id: true, title: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) notFound();

  return (
    <div>
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-2 text-sm text-anthracite-500 hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Tickets
      </Link>
      <h1 className="mt-4 text-xl font-bold text-anthracite">{ticket.subject}</h1>
      <p className="text-sm text-anthracite-500">
        {ticket.user.name ?? ticket.user.email} · {TICKET_STATUS_LABELS[ticket.status]}
        {ticket.assignedTo && ` · Assigné à ${ticket.assignedTo.name}`}
      </p>
      <p className="mt-1 text-xs text-anthracite-400">
        {TICKET_CATEGORY_LABELS[ticket.category]} ·{" "}
        {TICKET_PRIORITY_LABELS[ticket.priority]}
      </p>

      {ticket.booking && (
        <Link
          href={`/admin/bookings?q=${encodeURIComponent(ticket.booking.listing.title)}`}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100"
        >
          <Calendar className="h-4 w-4" />
          Réservation : {ticket.booking.listing.title} ({formatDate(ticket.booking.startDate)})
        </Link>
      )}

      <AdminTicketPanel
        ticketId={ticket.id}
        initialStatus={ticket.status}
        initialCategory={ticket.category}
        initialPriority={ticket.priority}
        initialAssignedToId={ticket.assignedToId}
        messages={ticket.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

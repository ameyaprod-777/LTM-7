"use client";

import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/ticket";
import type { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { TicketMessageList, type TicketMessageItem } from "@/components/support/ticket-message-list";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { formatDate } from "@/lib/utils";

type Props = {
  ticket: {
    id: string;
    subject: string;
    status: TicketStatus;
    category: TicketCategory;
    priority: TicketPriority;
    booking: {
      id: string;
      listing: { id: string; title: string };
      startDate: string;
    } | null;
    messages: TicketMessageItem[];
  };
};

export function MemberTicketView({ ticket }: Props) {
  return (
    <div>
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-2 text-sm text-anthracite-500 hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>
      <h1 className="mt-4 text-xl font-bold text-anthracite">{ticket.subject}</h1>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-anthracite-100 px-2 py-0.5">
          {TICKET_STATUS_LABELS[ticket.status]}
        </span>
        <span className="rounded-full bg-anthracite-100 px-2 py-0.5">
          {TICKET_CATEGORY_LABELS[ticket.category]}
        </span>
      </div>

      {ticket.booking && (
        <Link
          href={`/dashboard/bookings`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          <Calendar className="h-4 w-4" />
          Réservation : {ticket.booking.listing.title} (
          {formatDate(ticket.booking.startDate)})
        </Link>
      )}

      <div className="mt-6">
        <TicketMessageList messages={ticket.messages} />
      </div>

      {ticket.status !== "CLOSED" && (
        <TicketReplyForm ticketId={ticket.id} />
      )}
    </div>
  );
}

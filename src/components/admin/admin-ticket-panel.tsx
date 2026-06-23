"use client";

import { useEffect, useState } from "react";
import {
  TICKET_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
} from "@/lib/ticket";
import type { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { TicketMessageList, type TicketMessageItem } from "@/components/support/ticket-message-list";

type Props = {
  ticketId: string;
  initialStatus: TicketStatus;
  initialCategory: TicketCategory;
  initialPriority: TicketPriority;
  initialAssignedToId: string | null;
  messages: TicketMessageItem[];
};

export function AdminTicketPanel({
  ticketId,
  initialStatus,
  initialCategory,
  initialPriority,
  initialAssignedToId,
  messages,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [priority, setPriority] = useState(initialPriority);
  const [assignedToId, setAssignedToId] = useState<string | null>(
    initialAssignedToId
  );
  const [agents, setAgents] = useState<{ id: string; name: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/support/agents")
      .then((r) => r.json())
      .then(setAgents);
  }, []);

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-anthracite-100 px-2 py-0.5">
          {TICKET_STATUS_LABELS[status]}
        </span>
        <span className="rounded-full bg-anthracite-100 px-2 py-0.5">
          {TICKET_CATEGORY_LABELS[category]}
        </span>
        <span className="rounded-full bg-anthracite-100 px-2 py-0.5">
          Priorité {TICKET_PRIORITY_LABELS[priority]}
        </span>
      </div>

      <div className="mt-6">
        <TicketMessageList messages={messages} />
      </div>

      <TicketReplyForm
        ticketId={ticketId}
        isStaff
        status={status}
        category={category}
        priority={priority}
        assignedToId={assignedToId}
        agents={agents}
        onStatusChange={(s) => setStatus(s as TicketStatus)}
        onCategoryChange={(c) => setCategory(c as TicketCategory)}
        onPriorityChange={(p) => setPriority(p as TicketPriority)}
        onAssignChange={setAssignedToId}
      />
    </>
  );
}

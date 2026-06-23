import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemberTicketView } from "@/components/support/member-ticket-view";

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      booking: {
        select: {
          id: true,
          startDate: true,
          listing: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!ticket) notFound();

  return (
    <MemberTicketView
      ticket={{
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        category: ticket.category,
        priority: ticket.priority,
        booking: ticket.booking
          ? {
              ...ticket.booking,
              startDate: ticket.booking.startDate.toISOString(),
            }
          : null,
        messages: ticket.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        })),
      }}
    />
  );
}

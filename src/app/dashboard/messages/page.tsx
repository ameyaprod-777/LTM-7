import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countUnreadPerConversation } from "@/lib/messaging";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ConversationList,
  type ConversationItem,
} from "@/components/messages/conversation-list";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: session.user.id, archivedAt: null },
      },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true } } },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      booking: { include: { listing: { select: { title: true } } } },
      service: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unreadMap = await countUnreadPerConversation(session.user.id);
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  const items: ConversationItem[] = conversations.map((c) => {
    const other = c.participants.find((p) => p.userId !== session.user.id)?.user;
    let contextLabel: string | null = null;
    if (c.directKey) contextLabel = "Message direct";
    else if (c.booking?.listing) contextLabel = `Réservation · ${c.booking.listing.title}`;
    else if (c.service) contextLabel = `Service · ${c.service.title}`;

    return {
      id: c.id,
      otherName: other?.name ?? null,
      contextLabel,
      preview: c.messages[0]?.body ?? null,
      unread: unreadMap[c.id] ?? 0,
    };
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-anthracite">Messages</h1>
        <p className="mt-1 text-sm text-anthracite-500">
          Réservations, services ou messages directs entre membres.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MessageSquare}
            title="Aucun message"
            description="Les conversations s'ouvrent lors d'une réservation, d'un service ou depuis le profil d'un membre."
            action={{ href: "/members", label: "Voir les membres" }}
          />
        </div>
      ) : (
        <ConversationList conversations={items} totalUnread={totalUnread} />
      )}
    </div>
  );
}

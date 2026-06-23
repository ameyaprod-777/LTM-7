import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, newMessageEmail } from "@/lib/email";
import { publishNewMessage } from "@/lib/pusher-server";
import { updateUserMessagingStats } from "@/lib/message-stats";

type CreateMessageInput = {
  conversationId: string;
  senderId: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
};

export async function createConversationMessage(input: CreateMessageInput) {
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: input.conversationId,
      userId: input.senderId,
    },
  });

  if (!participant) {
    throw new Error("NOT_PARTICIPANT");
  }

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body.trim() || (input.attachmentUrl ? "📎 Pièce jointe" : ""),
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentName: input.attachmentName ?? null,
      attachmentMime: input.attachmentMime ?? null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  const others = await prisma.conversationParticipant.findMany({
    where: {
      conversationId: input.conversationId,
      userId: { not: input.senderId },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const senderName = message.sender.name ?? "Un membre";

  for (const p of others) {
    await createNotification({
      userId: p.userId,
      type: "NEW_MESSAGE",
      title: "Nouveau message",
      body: message.body.slice(0, 120),
      link: `/dashboard/messages/${input.conversationId}`,
      sendEmailNotification: false,
    });

    if (p.user.email && !p.user.email.endsWith("@louetonmatos.invalid")) {
      void sendEmail({
        to: p.user.email,
        subject: `Nouveau message de ${senderName}`,
        html: newMessageEmail(
          p.user.name ?? "Membre",
          senderName,
          message.body,
          input.conversationId
        ),
      });
    }
  }

  await publishNewMessage(input.conversationId, {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    sender: message.sender,
    attachmentUrl: message.attachmentUrl,
    attachmentName: message.attachmentName,
    attachmentMime: message.attachmentMime,
  });

  void updateUserMessagingStats(input.senderId);

  return message;
}

const activeParticipantFilter = (userId: string) => ({
  some: { userId, archivedAt: null },
});

const unreadWhere = (userId: string) => ({
  readAt: null,
  deletedAt: null,
  senderId: { not: userId },
  conversation: {
    participants: activeParticipantFilter(userId),
  },
});

export async function markConversationAsRead(
  conversationId: string,
  readerId: string
) {
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: readerId },
      readAt: null,
      deletedAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function markAllConversationsAsRead(userId: string) {
  await prisma.message.updateMany({
    where: unreadWhere(userId),
    data: { readAt: new Date() },
  });
}

export async function softDeleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, conversationId: true, deletedAt: true },
  });

  if (!message) {
    throw new Error("NOT_FOUND");
  }
  if (message.senderId !== userId) {
    throw new Error("FORBIDDEN");
  }
  if (message.deletedAt) {
    return message;
  }

  return prisma.message.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
      body: "",
      attachmentUrl: null,
      attachmentName: null,
      attachmentMime: null,
    },
    select: { id: true, conversationId: true, deletedAt: true },
  });
}

export async function countUnreadMessages(userId: string) {
  return prisma.message.count({
    where: unreadWhere(userId),
  });
}

export async function countUnreadPerConversation(userId: string) {
  const rows = await prisma.message.groupBy({
    by: ["conversationId"],
    where: unreadWhere(userId),
    _count: { id: true },
  });

  return Object.fromEntries(
    rows.map((r) => [r.conversationId, r._count.id])
  ) as Record<string, number>;
}

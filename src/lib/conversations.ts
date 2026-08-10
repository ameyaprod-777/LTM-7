import { prisma } from "@/lib/prisma";
import { createConversationMessage } from "@/lib/messaging";

export function makeDirectConversationKey(userIdA: string, userIdB: string) {
  return [userIdA, userIdB].sort().join("_");
}

export async function getOrCreateDirectConversation(
  initiatorId: string,
  targetUserId: string,
  initialMessage?: string
) {
  if (initiatorId === targetUserId) {
    throw new Error("SELF_CONTACT");
  }

  const target = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      status: "ACTIVE",
      // Contact messagerie réservé aux membres (pas ADMIN)
      role: "MEMBER",
    },
    select: { id: true, name: true },
  });

  if (!target) {
    throw new Error("USER_NOT_FOUND");
  }

  const directKey = makeDirectConversationKey(initiatorId, targetUserId);

  const existing = await prisma.conversation.findUnique({
    where: { directKey },
  });

  if (existing) {
    if (initialMessage?.trim()) {
      await createConversationMessage({
        conversationId: existing.id,
        senderId: initiatorId,
        body: initialMessage.trim(),
      });
    }
    return existing;
  }

  const conversation = await prisma.conversation.create({
    data: {
      directKey,
      initiatorId,
      participants: {
        create: [{ userId: initiatorId }, { userId: targetUserId }],
      },
    },
  });

  const greeting =
    initialMessage?.trim() ||
    `Bonjour ${target.name ?? ""}, je souhaite échanger avec vous via LoueTonMatos.`.trim();

  await createConversationMessage({
    conversationId: conversation.id,
    senderId: initiatorId,
    body: greeting,
  });

  return conversation;
}

export async function getOrCreateServiceConversation(
  initiatorId: string,
  serviceId: string,
  initialMessage?: string
) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, status: "ACTIVE" },
    select: { id: true, ownerId: true, title: true },
  });

  if (!service) {
    throw new Error("SERVICE_NOT_FOUND");
  }

  if (service.ownerId === initiatorId) {
    throw new Error("SELF_CONTACT");
  }

  const existing = await prisma.conversation.findFirst({
    where: { serviceId, initiatorId },
  });

  if (existing) {
    if (initialMessage?.trim()) {
      await prisma.message.create({
        data: {
          conversationId: existing.id,
          senderId: initiatorId,
          body: initialMessage.trim(),
        },
      });
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { updatedAt: new Date() },
      });
    }
    return existing;
  }

  const conversation = await prisma.conversation.create({
    data: {
      serviceId,
      initiatorId,
      participants: {
        create: [{ userId: initiatorId }, { userId: service.ownerId }],
      },
    },
  });

  const greeting =
    initialMessage?.trim() ||
    `Bonjour, je suis intéressé·e par votre prestation « ${service.title} ».`;

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: initiatorId,
      body: greeting,
    },
  });

  return conversation;
}

/** Nouvelle conversation pour chaque demande de devis (plusieurs devis par client/service). */
export async function createNewServiceConversation(
  initiatorId: string,
  serviceId: string,
  initialMessage?: string
) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, status: "ACTIVE" },
    select: { id: true, ownerId: true, title: true },
  });

  if (!service) {
    throw new Error("SERVICE_NOT_FOUND");
  }

  if (service.ownerId === initiatorId) {
    throw new Error("SELF_CONTACT");
  }

  const conversation = await prisma.conversation.create({
    data: {
      serviceId,
      initiatorId,
      participants: {
        create: [{ userId: initiatorId }, { userId: service.ownerId }],
      },
    },
  });

  const greeting =
    initialMessage?.trim() ||
    `Bonjour, je suis intéressé·e par votre prestation « ${service.title} ».`;

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: initiatorId,
      body: greeting,
    },
  });

  return conversation;
}

export async function archiveConversationForUser(
  conversationId: string,
  userId: string
) {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
  });

  if (!participant) {
    throw new Error("NOT_PARTICIPANT");
  }

  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { archivedAt: new Date() },
  });
}

export async function getConversationForBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ renterId: userId }, { listerId: userId }],
    },
    include: { conversation: true },
  });

  return booking?.conversation ?? null;
}

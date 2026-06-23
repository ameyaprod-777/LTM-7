import { prisma } from "@/lib/prisma";

const RESPONSE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Recalcule responseRate et avgResponseTimeMs pour un membre
 * à partir de ses réponses dans les conversations.
 */
export async function updateUserMessagingStats(userId: string) {
  const sent = await prisma.message.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      conversationId: true,
      createdAt: true,
    },
    take: 500,
  });

  if (sent.length === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { responseRate: null, avgResponseTimeMs: null },
    });
    return;
  }

  const deltas: number[] = [];
  let repliedInWindow = 0;
  let opportunities = 0;

  const byConversation = new Map<string, typeof sent>();
  for (const m of sent) {
    const list = byConversation.get(m.conversationId) ?? [];
    list.push(m);
    byConversation.set(m.conversationId, list);
  }

  for (const [conversationId, userMessages] of Array.from(byConversation.entries())) {
    const incoming = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        createdAt: { lt: userMessages[userMessages.length - 1]!.createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    for (const inc of incoming) {
      const reply = userMessages.find((m) => m.createdAt > inc.createdAt);
      if (!reply) continue;
      opportunities += 1;
      const delta = reply.createdAt.getTime() - inc.createdAt.getTime();
      deltas.push(delta);
      if (delta <= RESPONSE_WINDOW_MS) {
        repliedInWindow += 1;
      }
      break;
    }
  }

  const responseRate =
    opportunities > 0 ? repliedInWindow / opportunities : null;

  const avgResponseTimeMs =
    deltas.length > 0
      ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
      : null;

  await prisma.user.update({
    where: { id: userId },
    data: { responseRate, avgResponseTimeMs },
  });
}

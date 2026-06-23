import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { markConversationAsRead } from "@/lib/messaging";

export async function GET(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: params.conversationId,
      userId: auth.session.user.id,
      archivedAt: null,
    },
  });
  if (!participant) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await markConversationAsRead(params.conversationId, auth.session.user.id);

  const messages = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    messages.map((m) => ({
      ...m,
      body: m.deletedAt ? "[Message supprimé]" : m.body,
      attachmentUrl: m.deletedAt ? null : m.attachmentUrl,
      attachmentName: m.deletedAt ? null : m.attachmentName,
      attachmentMime: m.deletedAt ? null : m.attachmentMime,
      deletedAt: m.deletedAt?.toISOString() ?? null,
    }))
  );
}

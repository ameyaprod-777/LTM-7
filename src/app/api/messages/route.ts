import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import {
  createConversationMessage,
  countUnreadPerConversation,
} from "@/lib/messaging";
import { enforceRateLimit } from "@/lib/rate-limit";

const postSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().max(10000),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentMime: z.string().optional(),
});

export async function GET() {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: auth.session.user.id, archivedAt: null },
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      booking: {
        include: { listing: { select: { title: true } } },
      },
      service: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unreadMap = await countUnreadPerConversation(auth.session.user.id);

  return NextResponse.json(
    conversations.map((c) => ({
      ...c,
      unreadCount: unreadMap[c.id] ?? 0,
    }))
  );
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "messages");
  if (limited) return limited;

  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const { conversationId, body: text, attachmentUrl, attachmentName, attachmentMime } =
    parsed.data;

  if (!text.trim() && !attachmentUrl) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  try {
    const message = await createConversationMessage({
      conversationId,
      senderId: auth.session.user.id,
      body: text,
      attachmentUrl,
      attachmentName,
      attachmentMime,
    });
    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_PARTICIPANT") {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    console.error("[messages POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMemberApi } from "@/lib/api-auth";
import { getOrCreateDirectConversation } from "@/lib/conversations";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  userId: z.string().min(1),
  message: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const conversation = await getOrCreateDirectConversation(
      auth.session.user.id,
      parsed.data.userId,
      parsed.data.message
    );

    if (parsed.data.userId !== auth.session.user.id) {
      const sender = await prisma.user.findUnique({
        where: { id: auth.session.user.id },
        select: { name: true },
      });

      await createNotification({
        userId: parsed.data.userId,
        type: "NEW_MESSAGE",
        title: "Nouveau message",
        body: `${sender?.name ?? "Un membre"} vous a contacté`,
        link: `/dashboard/messages/${conversation.id}`,
      });
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }
    if (code === "SELF_CONTACT") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous contacter vous-même" },
        { status: 400 }
      );
    }
    console.error("[conversations/direct]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

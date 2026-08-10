import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMemberApi } from "@/lib/api-auth";
import { getOrCreateDirectConversation } from "@/lib/conversations";

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

    // Notification + email + Pusher : gérés par createConversationMessage
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

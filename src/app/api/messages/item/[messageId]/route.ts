import { NextResponse } from "next/server";
import { requireMemberApi } from "@/lib/api-auth";
import { softDeleteMessage } from "@/lib/messaging";
import { publishMessageDeleted } from "@/lib/pusher-server";

export async function DELETE(
  _req: Request,
  { params }: { params: { messageId: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  try {
    const message = await softDeleteMessage(
      params.messageId,
      auth.session.user.id
    );
    await publishMessageDeleted(message.conversationId, message.id);
    return NextResponse.json({ ok: true, id: message.id });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "NOT_FOUND") {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    }
    if (code === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    console.error("[messages DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

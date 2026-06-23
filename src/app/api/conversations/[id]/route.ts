import { NextResponse } from "next/server";
import { requireMemberApi } from "@/lib/api-auth";
import { archiveConversationForUser } from "@/lib/conversations";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  try {
    await archiveConversationForUser(params.id, auth.session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "NOT_PARTICIPANT") {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    console.error("[conversations DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

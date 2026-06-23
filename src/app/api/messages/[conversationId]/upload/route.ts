import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { saveMessageAttachment } from "@/lib/message-storage";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const limited = enforceRateLimit(req, "messageUpload");
  if (limited) return limited;

  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: params.conversationId,
      userId: auth.session.user.id,
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const stored = await saveMessageAttachment(params.conversationId, file);
    return NextResponse.json(stored, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

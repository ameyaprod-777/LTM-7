import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { notifyAdmins } from "@/lib/notifications";

const schema = z.object({
  reason: z.string().min(10).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const message = await prisma.message.findUnique({
    where: { id: params.messageId },
    include: {
      sender: { select: { name: true } },
      conversation: { select: { id: true } },
    },
  });

  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }

  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: message.conversationId,
      userId: auth.session.user.id,
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (message.senderId === auth.session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas signaler votre propre message." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Motif trop court" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.messageReport.create({
      data: {
        messageId: message.id,
        reporterId: auth.session.user.id,
        reason: parsed.data.reason,
      },
    }),
    prisma.message.update({
      where: { id: message.id },
      data: { flagged: true, flagReason: parsed.data.reason.slice(0, 500) },
    }),
  ]);

  await notifyAdmins({
    type: "ADMIN_NEW_APPLICATION",
    title: "Message signalé",
    body: `${message.sender.name ?? "Membre"} — conversation ${message.conversationId}`,
    link: `/dashboard/messages/${message.conversationId}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

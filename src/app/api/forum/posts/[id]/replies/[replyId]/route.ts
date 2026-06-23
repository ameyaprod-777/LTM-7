import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession, forbidden } from "@/lib/api-auth";
import { canEditForumContent } from "@/lib/forum-query";

const patchSchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; replyId: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const reply = await prisma.forumReply.findFirst({
    where: { id: params.replyId, postId: params.id },
  });

  if (!reply) {
    return NextResponse.json({ error: "Réponse introuvable" }, { status: 404 });
  }

  if (reply.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return forbidden();
  }

  if (
    reply.authorId === session.user.id &&
    !canEditForumContent(reply.createdAt)
  ) {
    return NextResponse.json(
      { error: "Délai de modification dépassé (15 minutes)." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const updated = await prisma.forumReply.update({
    where: { id: params.replyId },
    data: { body: parsed.data.body, editedAt: new Date() },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; replyId: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const reply = await prisma.forumReply.findFirst({
    where: { id: params.replyId, postId: params.id },
  });

  if (!reply) {
    return NextResponse.json({ error: "Réponse introuvable" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  if (reply.authorId !== session.user.id && !isAdmin) {
    return forbidden();
  }

  if (
    !isAdmin &&
    reply.authorId === session.user.id &&
    !canEditForumContent(reply.createdAt)
  ) {
    return NextResponse.json(
      { error: "Délai de suppression dépassé (15 minutes)." },
      { status: 403 }
    );
  }

  await prisma.forumReply.delete({ where: { id: params.replyId } });
  return NextResponse.json({ ok: true });
}

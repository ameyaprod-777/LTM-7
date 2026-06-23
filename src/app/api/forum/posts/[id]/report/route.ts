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
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, authorId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Publication introuvable" }, { status: 404 });
  }

  if (post.authorId === auth.session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas signaler votre propre publication." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Motif trop court" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.forumPostReport.create({
      data: {
        postId: post.id,
        reporterId: auth.session.user.id,
        reason: parsed.data.reason,
      },
    }),
    prisma.forumPost.update({
      where: { id: post.id },
      data: { flagged: true, flagReason: parsed.data.reason.slice(0, 500) },
    }),
  ]);

  await notifyAdmins({
    type: "ADMIN_NEW_APPLICATION",
    title: "Publication signalée — fil Actu",
    body: post.title,
    link: `/admin/forum?highlight=${post.id}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

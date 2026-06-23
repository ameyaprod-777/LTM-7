import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { z } from "zod";

const replySchema = z.object({ body: z.string().min(1).max(5000) });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const post = await prisma.forumPost.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Sujet introuvable" }, { status: 404 });
  }
  if (post.locked) {
    return NextResponse.json({ error: "Sujet verrouillé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const reply = await prisma.forumReply.create({
    data: {
      postId: params.id,
      authorId: auth.session.user.id,
      body: parsed.data.body,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(reply, { status: 201 });
}

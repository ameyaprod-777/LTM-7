import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const existing = await prisma.forumReaction.findUnique({
    where: {
      postId_userId: { postId: params.id, userId: auth.session.user.id },
    },
  });

  if (existing) {
    await prisma.forumReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ reacted: false });
  }

  await prisma.forumReaction.create({
    data: { postId: params.id, userId: auth.session.user.id },
  });

  return NextResponse.json({ reacted: true });
}

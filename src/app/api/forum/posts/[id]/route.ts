import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession, forbidden } from "@/lib/api-auth";
import { canEditForumContent } from "@/lib/forum-query";

const authorPatchSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  body: z.string().min(5).max(10000).optional(),
  tags: z.array(z.string()).max(5).optional(),
  city: z.string().max(100).optional().nullable(),
  eventAt: z.string().datetime().optional().nullable(),
  projectUrl: z.string().url().optional().or(z.literal("")).nullable(),
  coverImage: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 }
    );
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, image: true, city: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { reactions: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Sujet introuvable" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();

  const isStaff =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  if (
    isStaff &&
    ("pinned" in body || "locked" in body || "authorHidden" in body)
  ) {
    const post = await prisma.forumPost.update({
      where: { id: params.id },
      data: {
        ...(typeof body.pinned === "boolean" ? { pinned: body.pinned } : {}),
        ...(typeof body.locked === "boolean" ? { locked: body.locked } : {}),
        ...(typeof body.authorHidden === "boolean"
          ? { authorHidden: body.authorHidden }
          : {}),
      },
    });
    return NextResponse.json(post);
  }

  const existing = await prisma.forumPost.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Sujet introuvable" }, { status: 404 });
  }

  if (existing.authorId !== session.user.id) {
    return forbidden();
  }

  if (!canEditForumContent(existing.createdAt)) {
    return NextResponse.json(
      { error: "Délai de modification dépassé (15 minutes)." },
      { status: 403 }
    );
  }

  const parsed = authorPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const data = parsed.data;
  const post = await prisma.forumPost.update({
    where: { id: params.id },
    data: {
      ...(data.title != null ? { title: data.title } : {}),
      ...(data.body != null ? { body: data.body } : {}),
      ...(data.tags != null
        ? {
            tags: data.tags.map((t) =>
              t.trim().toLowerCase().replace(/^#/, "")
            ),
          }
        : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.eventAt !== undefined
        ? { eventAt: data.eventAt ? new Date(data.eventAt) : null }
        : {}),
      ...(data.projectUrl !== undefined
        ? { projectUrl: data.projectUrl || null }
        : {}),
      ...(data.coverImage !== undefined
        ? { coverImage: data.coverImage || null }
        : {}),
      editedAt: new Date(),
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const existing = await prisma.forumPost.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Sujet introuvable" }, { status: 404 });
  }

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";
  const isAuthor = existing.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return forbidden();
  }

  if (isAuthor && !isAdmin && !canEditForumContent(existing.createdAt)) {
    return NextResponse.json(
      { error: "Délai de suppression dépassé (15 minutes)." },
      { status: 403 }
    );
  }

  await prisma.forumPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

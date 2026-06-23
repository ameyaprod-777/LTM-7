import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { z } from "zod";

const projectSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).max(10).default([]),
});

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      coverImage: parsed.data.coverImage || null,
      userId: auth.session.user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  await prisma.project.deleteMany({
    where: { id, userId: auth.session.user.id },
  });

  return NextResponse.json({ ok: true });
}

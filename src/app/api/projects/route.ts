import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { z } from "zod";
import {
  MAX_PROFILE_PROJECTS,
  VIDEO_URL_ERROR,
  parseVideoUrl,
} from "@/lib/video-embed";

const projectSchema = z.object({
  title: z.string().min(2, "Titre trop court").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  videoUrl: z.string().min(1, "Lien vidéo requis"),
  tags: z.array(z.string().max(40)).max(10).default([]),
});

function normalizeProjectInput(data: z.infer<typeof projectSchema>) {
  const parsed = parseVideoUrl(data.videoUrl);
  if (!parsed) {
    return { error: VIDEO_URL_ERROR } as const;
  }
  return {
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      videoUrl: parsed.canonicalUrl,
      coverImage: null as string | null,
      tags: data.tags.map((t) => t.trim()).filter(Boolean).slice(0, 10),
    },
  } as const;
}

export async function GET() {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const projects = await prisma.project.findMany({
    where: { userId: auth.session.user.id },
    orderBy: { createdAt: "asc" },
    take: MAX_PROFILE_PROJECTS,
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const normalized = normalizeProjectInput(parsed.data);
  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const count = await prisma.project.count({
    where: { userId: auth.session.user.id },
  });
  if (count >= MAX_PROFILE_PROJECTS) {
    return NextResponse.json(
      {
        error: `Maximum ${MAX_PROFILE_PROJECTS} projets. Modifiez ou supprimez un projet existant.`,
      },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      ...normalized.data,
      userId: auth.session.user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const schema = projectSchema.extend({
    id: z.string().min(1),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const normalized = normalizeProjectInput(parsed.data);
  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const result = await prisma.project.updateMany({
    where: { id: parsed.data.id, userId: auth.session.user.id },
    data: normalized.data,
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.id },
  });

  return NextResponse.json(project);
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { postTypeToSection } from "@/lib/forum";
import { buildForumPostWhere } from "@/lib/forum-query";
import { notifyUrgentNeed } from "@/lib/forum-urgent";
import { z } from "zod";
import { ForumPostType, ForumSection } from "@prisma/client";

const postSchema = z
  .object({
    postType: z.nativeEnum(ForumPostType),
    section: z.nativeEnum(ForumSection).optional(),
    title: z.string().min(3).max(200),
    body: z.string().min(5).max(10000),
    tags: z.array(z.string()).max(5).default([]),
    city: z.string().max(100).optional(),
    eventAt: z.string().datetime().optional().nullable(),
    projectUrl: z.string().url().optional().or(z.literal("")),
    coverImage: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.postType === ForumPostType.NEED && !data.eventAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez quand vous en avez besoin",
        path: ["eventAt"],
      });
    }
  });

export async function GET(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ForumPostType | null;
  const section = searchParams.get("section") as ForumSection | null;
  const tag = searchParams.get("tag") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const where = buildForumPostWhere({
    type:
      type && Object.values(ForumPostType).includes(type) ? type : undefined,
    section:
      section && Object.values(ForumSection).includes(section)
        ? section
        : undefined,
    tag,
    q,
  });

  const posts = await prisma.forumPost.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, image: true, city: true } },
      _count: { select: { replies: true, reactions: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const normalizedTags = data.tags.map((t) =>
    t.trim().toLowerCase().replace(/^#/, "")
  );

  const post = await prisma.forumPost.create({
    data: {
      postType: data.postType,
      section: data.section ?? postTypeToSection(data.postType),
      title: data.title,
      body: data.body,
      tags: normalizedTags,
      city: data.city || null,
      eventAt: data.eventAt ? new Date(data.eventAt) : null,
      projectUrl: data.projectUrl || null,
      coverImage: data.coverImage || null,
      authorId: auth.session.user.id,
    },
  });

  if (data.postType === ForumPostType.NEED) {
    void notifyUrgentNeed({
      id: post.id,
      title: post.title,
      eventAt: post.eventAt,
      city: post.city,
      authorId: post.authorId,
    });
  }

  return NextResponse.json(post, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { serviceSchema } from "@/lib/validations/service";
import { eurosToCents } from "@/lib/money";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const service = await prisma.service.findUnique({
    where: { id: params.id, status: "ACTIVE" },
    include: {
      photos: { orderBy: { order: "asc" } },
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          city: true,
          verifiedIdentity: true,
          memberSince: true,
        },
      },
    },
  });

  if (!service) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(service);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const existing = await prisma.service.findUnique({ where: { id: params.id } });
  if (!existing || existing.ownerId !== auth.session.user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  await prisma.$transaction([
    prisma.servicePhoto.deleteMany({ where: { serviceId: params.id } }),
    prisma.service.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        rateType: data.rateType,
        priceAmount: eurosToCents(data.priceAmount as number),
        city: data.city,
        neighborhood: data.neighborhood,
        experienceYears: data.experienceYears ?? null,
        portfolioUrl: data.portfolioUrl || null,
        photos: {
          create: data.photoUrls.map((url, i) => ({ url, order: i })),
        },
      },
    }),
  ]);

  return NextResponse.json({ id: params.id });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const existing = await prisma.service.findUnique({ where: { id: params.id } });
  if (!existing || existing.ownerId !== auth.session.user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (existing.status === "REMOVED") {
    return NextResponse.json({ ok: true });
  }

  const activeQuotes = await prisma.serviceQuote.count({
    where: {
      serviceId: params.id,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });

  if (activeQuotes > 0) {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer : des demandes de devis sont en cours.",
      },
      { status: 409 }
    );
  }

  await prisma.service.update({
    where: { id: params.id },
    data: { status: "REMOVED" },
  });

  return NextResponse.json({ ok: true });
}

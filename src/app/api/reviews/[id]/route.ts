import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession, forbidden } from "@/lib/api-auth";

const responseSchema = z.object({
  response: z.string().min(5).max(2000),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();

  if (session.user.role === "ADMIN" && "flagged" in body) {
    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        flagged: Boolean(body.flagged),
        ...(body.flagged === false ? { flagReason: null } : {}),
      },
    });
    return NextResponse.json(review);
  }

  const review = await prisma.review.findUnique({
    where: { id: params.id },
  });

  if (!review) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }

  if (review.targetId !== session.user.id) {
    return forbidden();
  }

  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
  }

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: {
      response: parsed.data.response,
      responseAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

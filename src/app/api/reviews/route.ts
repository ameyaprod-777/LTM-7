import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const reviewSchema = z
  .object({
    bookingId: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
    equipmentRating: z.number().int().min(1).max(5).optional(),
    equipmentComment: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.equipmentComment && !data.equipmentRating) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Note matériel requise avec un commentaire matériel",
        path: ["equipmentRating"],
      });
    }
  });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { targetId: userId, flagged: false },
    include: {
      author: { select: { id: true, name: true, image: true } },
      booking: {
        select: { listing: { select: { title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(reviews);
}

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
  });

  if (!booking || booking.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Réservation non éligible aux avis" },
      { status: 400 }
    );
  }

  const isRenter = booking.renterId === auth.session.user.id;
  const isLister = booking.listerId === auth.session.user.id;
  if (!isRenter && !isLister) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!isRenter && (parsed.data.equipmentRating || parsed.data.equipmentComment)) {
    return NextResponse.json(
      { error: "Seul le locataire peut noter le matériel" },
      { status: 400 }
    );
  }

  const targetId = isRenter ? booking.listerId : booking.renterId;

  const existing = await prisma.review.findUnique({
    where: {
      bookingId_authorId: {
        bookingId: parsed.data.bookingId,
        authorId: auth.session.user.id,
      },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Avis déjà publié" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: parsed.data.bookingId,
      authorId: auth.session.user.id,
      targetId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      equipmentRating: isRenter ? parsed.data.equipmentRating ?? null : null,
      equipmentComment: isRenter ? parsed.data.equipmentComment ?? null : null,
    },
  });

  await createNotification({
    userId: targetId,
    type: "NEW_REVIEW",
    title: "Nouvel avis reçu",
    link: `/profile/${targetId}`,
  });

  return NextResponse.json(review, { status: 201 });
}

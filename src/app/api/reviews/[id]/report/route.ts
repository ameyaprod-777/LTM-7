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

  const review = await prisma.review.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { name: true } },
      booking: { select: { listing: { select: { title: true } } } },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }

  if (review.targetId !== auth.session.user.id) {
    return NextResponse.json(
      { error: "Seule la personne concernée peut signaler cet avis." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Motif trop court (min. 10 caractères)" }, { status: 400 });
  }

  await prisma.review.update({
    where: { id: review.id },
    data: {
      flagged: true,
      flagReason: parsed.data.reason.slice(0, 500),
    },
  });

  await notifyAdmins({
    type: "ADMIN_NEW_APPLICATION",
    title: "Avis signalé",
    body: `${review.author.name ?? "Membre"} — ${review.booking.listing.title}`,
    link: `/admin/reviews?highlight=${review.id}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

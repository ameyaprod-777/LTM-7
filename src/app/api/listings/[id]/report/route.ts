import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { listingReportSchema } from "@/lib/validations/listing";
import { TicketCategory } from "@prisma/client";
import { notifyAdminsNewTicket } from "@/lib/ticket-notify";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const listing = await prisma.listing.findUnique({
    where: { id: params.id, status: { not: "REMOVED" } },
    select: { id: true, title: true, ownerId: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  if (listing.ownerId === auth.session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas signaler votre propre annonce." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = listingReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Motif trop court" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: auth.session.user.id,
      listingId: listing.id,
      category: TicketCategory.BOOKING_DISPUTE,
      subject: `Signalement : ${listing.title}`,
      messages: {
        create: {
          body: parsed.data.reason,
          authorId: auth.session.user.id,
        },
      },
    },
  });

  await notifyAdminsNewTicket({ id: ticket.id, subject: ticket.subject });

  return NextResponse.json({ ok: true, ticketId: ticket.id }, { status: 201 });
}

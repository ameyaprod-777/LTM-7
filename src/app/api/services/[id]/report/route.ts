import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { serviceReportSchema } from "@/lib/validations/service";
import { TicketCategory } from "@prisma/client";
import { notifyAdminsNewTicket } from "@/lib/ticket-notify";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const service = await prisma.service.findUnique({
    where: { id: params.id, status: { not: "REMOVED" } },
    select: { id: true, title: true, ownerId: true },
  });

  if (!service) {
    return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
  }

  if (service.ownerId === auth.session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas signaler votre propre service." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = serviceReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Motif trop court" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: auth.session.user.id,
      serviceId: service.id,
      category: TicketCategory.OTHER,
      subject: `Signalement : ${service.title}`,
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

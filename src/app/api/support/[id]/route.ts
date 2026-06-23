import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession, forbidden } from "@/lib/api-auth";
import { isStaffRole } from "@/lib/staff";
import { TicketStatus, TicketCategory, TicketPriority } from "@prisma/client";
import { notifyMemberStaffReply } from "@/lib/ticket-notify";
import { logAudit, getClientIp } from "@/lib/audit-log";

const staffUpdateSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedToId: z.string().nullable().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentMime: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      booking: {
        select: {
          id: true,
          status: true,
          startDate: true,
          listing: { select: { id: true, title: true } },
        },
      },
      listing: { select: { id: true, title: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  if (
    ticket.userId !== session.user.id &&
    !isStaffRole(session.user.role)
  ) {
    return forbidden();
  }

  return NextResponse.json(ticket);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const isStaff = isStaffRole(session.user.role);
  if (ticket.userId !== session.user.id && !isStaff) {
    return forbidden();
  }

  const raw = await req.json();
  const parsed = staffUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const data = parsed.data;

  if (
    (data.status ||
      data.category ||
      data.priority ||
      data.assignedToId !== undefined) &&
    !isStaff
  ) {
    return forbidden();
  }

  if (data.assignedToId) {
    const agent = await prisma.user.findUnique({
      where: { id: data.assignedToId },
      select: { role: true },
    });
    if (!agent || !isStaffRole(agent.role)) {
      return NextResponse.json({ error: "Agent invalide" }, { status: 400 });
    }
  }

  let staffReplied = false;

  if (data.body?.trim() || data.attachmentUrl) {
    await prisma.ticketMessage.create({
      data: {
        ticketId: params.id,
        body:
          data.body?.trim() ||
          `Pièce jointe : ${data.attachmentName ?? "document"}`,
        authorId: session.user.id,
        isStaff,
        attachmentUrl: data.attachmentUrl ?? null,
        attachmentName: data.attachmentName ?? null,
        attachmentMime: data.attachmentMime ?? null,
      },
    });
    if (isStaff) staffReplied = true;
  }

  const updateData: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    assignedToId?: string | null;
  } = {};

  if (data.status) updateData.status = data.status;
  if (data.category) updateData.category = data.category;
  if (data.priority) updateData.priority = data.priority;
  if (data.assignedToId !== undefined) {
    updateData.assignedToId = data.assignedToId;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
    });

    if (isStaff) {
      void logAudit({
        adminId: session.user.id,
        action: "ticket.update",
        targetType: "SupportTicket",
        targetId: params.id,
        metadata: updateData,
        ipAddress: getClientIp(req),
      });
    }
  }

  if (staffReplied && ticket.userId !== session.user.id) {
    const preview =
      data.body?.trim() ||
      `Pièce jointe : ${data.attachmentName ?? "document"}`;
    await notifyMemberStaffReply({
      id: ticket.id,
      subject: ticket.subject,
      userId: ticket.userId,
      preview,
    });
  }

  await prisma.supportTicket.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

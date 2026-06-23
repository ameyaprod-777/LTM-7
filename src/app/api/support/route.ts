import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { isStaffRole } from "@/lib/staff";
import { z } from "zod";
import { TicketCategory, TicketPriority } from "@prisma/client";
import { notifyAdminsNewTicket } from "@/lib/ticket-notify";

const ticketSchema = z.object({
  subject: z.string().min(5).max(200),
  body: z.string().min(10).max(5000),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  bookingId: z.string().optional(),
});

export async function GET(req: Request) {
  const memberAuth = await requireMemberApi();
  if ("error" in memberAuth) return memberAuth.error;

  const isStaff = isStaffRole(memberAuth.session.user.role);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category") as TicketCategory | null;
  const assignedToId = searchParams.get("assignedToId");

  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(isStaff ? {} : { userId: memberAuth.session.user.id }),
      ...(status ? { status: status as never } : {}),
      ...(category && Object.values(TicketCategory).includes(category)
        ? { category }
        : {}),
      ...(assignedToId === "unassigned"
        ? { assignedToId: null }
        : assignedToId
          ? { assignedToId }
          : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      booking: {
        select: {
          id: true,
          listing: { select: { title: true } },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  if (parsed.data.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: parsed.data.bookingId },
    });
    if (!booking) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 400 }
      );
    }
    const isParty =
      booking.renterId === auth.session.user.id ||
      booking.listerId === auth.session.user.id;
    if (!isParty && !isStaffRole(auth.session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const category =
    parsed.data.category ??
    (parsed.data.bookingId ? TicketCategory.BOOKING_DISPUTE : TicketCategory.OTHER);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: auth.session.user.id,
      subject: parsed.data.subject,
      category,
      priority: parsed.data.priority ?? TicketPriority.NORMAL,
      bookingId: parsed.data.bookingId ?? null,
      messages: {
        create: {
          body: parsed.data.body,
          authorId: auth.session.user.id,
        },
      },
    },
  });

  await notifyAdminsNewTicket({ id: ticket.id, subject: ticket.subject });

  return NextResponse.json(ticket, { status: 201 });
}

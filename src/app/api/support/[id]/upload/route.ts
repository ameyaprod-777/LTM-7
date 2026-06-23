import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession, forbidden } from "@/lib/api-auth";
import { isStaffRole } from "@/lib/staff";
import { saveTicketAttachment } from "@/lib/ticket-storage";

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
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const isStaff = isStaffRole(session.user.role);
  if (ticket.userId !== session.user.id && !isStaff) {
    return forbidden();
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const stored = await saveTicketAttachment(params.id, file);
    return NextResponse.json(stored, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

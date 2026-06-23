import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getApiSession, forbidden } from "@/lib/api-auth";
import { isStaffRole } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { getTicketAttachmentPath } from "@/lib/ticket-storage";

export async function GET(
  _req: Request,
  { params }: { params: { ticketId: string; filename: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.ticketId },
    select: { userId: true },
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

  try {
    const filePath = getTicketAttachmentPath(params.ticketId, params.filename);
    const buffer = await readFile(filePath);
    const ext = params.filename.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "pdf"
            ? "application/pdf"
            : "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}

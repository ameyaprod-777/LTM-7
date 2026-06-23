import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import { parseDateKey } from "@/lib/service-availability";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; date: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service) {
    return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
  }

  if (
    service.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  const date = parseDateKey(params.date);

  await prisma.serviceBlockedDate.deleteMany({
    where: { serviceId: params.id, date },
  });

  return NextResponse.json({ ok: true });
}

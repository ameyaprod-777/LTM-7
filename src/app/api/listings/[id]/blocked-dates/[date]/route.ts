import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import { parseDateKey } from "@/lib/listing-availability";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; date: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }
  if (
    listing.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  await prisma.blockedDate.deleteMany({
    where: {
      listingId: params.id,
      date: parseDateKey(params.date),
    },
  });

  return NextResponse.json({ ok: true });
}

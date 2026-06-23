import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

/** Passe les réservations CONFIRMED en ACTIVE à partir de la date de début */
export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = startOfDay(new Date());

  const result = await prisma.booking.updateMany({
    where: {
      status: "CONFIRMED",
      startDate: { lte: today },
    },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ ok: true, activated: result.count });
}

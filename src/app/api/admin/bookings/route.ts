import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffApi } from "@/lib/api-auth";
import type { BookingStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as BookingStatus | null;
  const q = searchParams.get("q")?.trim();

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { listing: { title: { contains: q, mode: "insensitive" } } },
              { renter: { email: { contains: q, mode: "insensitive" } } },
              { lister: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      listing: { select: { id: true, title: true } },
      renter: { select: { id: true, name: true, email: true } },
      lister: { select: { id: true, name: true, email: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(bookings);
}

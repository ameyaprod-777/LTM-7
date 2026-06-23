import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffApi } from "@/lib/api-auth";
import type { ListingStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as ListingStatus | null;
  const q = searchParams.get("q")?.trim();

  const listings = await prisma.listing.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { owner: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { bookings: true, reports: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(listings);
}

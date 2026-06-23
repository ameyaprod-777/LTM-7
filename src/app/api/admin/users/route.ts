import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffApi } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const role = searchParams.get("role");
  const q = searchParams.get("q");

  const users = await prisma.user.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(role ? { role: role as never } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      city: true,
      memberSince: true,
      createdAt: true,
      _count: { select: { listings: true, bookingsAsRenter: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(users);
}

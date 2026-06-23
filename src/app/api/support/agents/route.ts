import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffApi } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const agents = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MODERATOR"] }, status: "ACTIVE" },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(agents);
}

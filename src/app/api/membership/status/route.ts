import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const application = await prisma.membershipApplication.findUnique({
    where: { userId: session.user.id },
    select: {
      status: true,
      adminMessage: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return NextResponse.json({
    role: session.user.role,
    application,
    hasApplication: !!application,
  });
}

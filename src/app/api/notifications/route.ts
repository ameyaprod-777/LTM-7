import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const { ids, all } = await req.json();

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id },
      data: { read: true },
    });
  } else if (Array.isArray(ids)) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}

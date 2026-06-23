import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import type { DeliveryTaskStatus } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const asLister = searchParams.get("role") === "lister";

  const tasks = await prisma.deliveryTask.findMany({
    where: asLister
      ? { booking: { listerId: auth.session.user.id } }
      : { booking: { renterId: auth.session.user.id } },
    include: {
      booking: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          listing: { select: { title: true } },
          renter: { select: { name: true } },
          lister: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(tasks);
}

const patchSchema = z.object({
  status: z.enum([
    "PENDING",
    "SCHEDULED",
    "IN_TRANSIT",
    "DELIVERED",
    "RETURNED",
  ]),
});

export async function PATCH(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");
  if (!taskId) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const task = await prisma.deliveryTask.findUnique({
    where: { id: taskId },
    include: { booking: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  if (
    task.booking.listerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const status = parsed.data.status as DeliveryTaskStatus;
  const updated = await prisma.deliveryTask.update({
    where: { id: taskId },
    data: {
      status,
      ...(status === "DELIVERED" || status === "RETURNED"
        ? { completedAt: new Date() }
        : {}),
    },
  });

  return NextResponse.json(updated);
}

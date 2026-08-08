import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffApi } from "@/lib/api-auth";
import { logAudit, getClientIp } from "@/lib/audit-log";
import type { ListingStatus } from "@prisma/client";
import { assertStripeConnectReadyForPublish } from "@/lib/stripe-connect-gate";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "DRAFT", "REMOVED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  if (parsed.data.status === "ACTIVE") {
    const existing = await prisma.service.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }
    const connect = await assertStripeConnectReadyForPublish(existing.ownerId);
    if (!connect.ok) return connect.response;
  }

  const service = await prisma.service.update({
    where: { id: params.id },
    data: { status: parsed.data.status as ListingStatus },
  });

  void logAudit({
    adminId: auth.session.user.id,
    action: "service.status_update",
    targetType: "Service",
    targetId: params.id,
    metadata: { status: parsed.data.status },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json(service);
}

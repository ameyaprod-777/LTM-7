import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/api-auth";
import { logAudit, getClientIp } from "@/lib/audit-log";

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  districts: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const zone = await prisma.deliveryZone.update({
    where: { id: params.id },
    data: parsed.data,
  });

  void logAudit({
    adminId: auth.session.user.id,
    action: "delivery_zone.update",
    targetType: "DeliveryZone",
    targetId: params.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json(zone);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  await prisma.deliveryZone.delete({ where: { id: params.id } });

  void logAudit({
    adminId: auth.session.user.id,
    action: "delivery_zone.delete",
    targetType: "DeliveryZone",
    targetId: params.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/api-auth";
import { logAudit, getClientIp } from "@/lib/audit-log";

const schema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  districts: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export async function GET() {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  const zones = await prisma.deliveryZone.findMany({
    orderBy: [{ active: "desc" }, { city: "asc" }],
  });
  return NextResponse.json(zones);
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const zone = await prisma.deliveryZone.create({ data: parsed.data });

  void logAudit({
    adminId: auth.session.user.id,
    action: "delivery_zone.create",
    targetType: "DeliveryZone",
    targetId: zone.id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json(zone, { status: 201 });
}

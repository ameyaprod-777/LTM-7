import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/api-auth";
import { logAudit, getClientIp } from "@/lib/audit-log";

export async function GET() {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const {
    commissionRate,
    invitationsEnabled,
    registrationClosed,
    maintenanceBanner,
    maintenanceBannerEnabled,
  } = body;

  const settings = await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      commissionRate: commissionRate ?? 0.12,
      invitationsEnabled: invitationsEnabled ?? true,
      registrationClosed: registrationClosed ?? false,
      maintenanceBanner: maintenanceBanner ?? null,
      maintenanceBannerEnabled: maintenanceBannerEnabled ?? false,
    },
    update: {
      ...(commissionRate !== undefined ? { commissionRate } : {}),
      ...(invitationsEnabled !== undefined ? { invitationsEnabled } : {}),
      ...(registrationClosed !== undefined ? { registrationClosed } : {}),
      ...(maintenanceBanner !== undefined ? { maintenanceBanner } : {}),
      ...(maintenanceBannerEnabled !== undefined
        ? { maintenanceBannerEnabled }
        : {}),
    },
  });

  void logAudit({
    adminId: auth.session.user.id,
    action: "settings.update",
    targetType: "PlatformSettings",
    targetId: "default",
    ipAddress: getClientIp(req),
  });

  return NextResponse.json(settings);
}

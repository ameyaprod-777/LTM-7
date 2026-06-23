import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAudit({
  adminId,
  action,
  targetType,
  targetId,
  metadata,
  ipAddress,
}: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata: metadata ?? undefined,
      ipAddress: ipAddress ?? undefined,
    },
  });
}

export function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

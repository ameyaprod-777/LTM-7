import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/api-auth";
import { getKycAbsolutePath } from "@/lib/kyc-storage";
import { logAudit, getClientIp } from "@/lib/audit-log";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  const doc = await prisma.kycDocument.findUnique({
    where: { id: params.id },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  void logAudit({
    adminId: auth.session.user.id,
    action: "kyc.view",
    targetType: "KycDocument",
    targetId: doc.id,
    metadata: {
      documentType: doc.type,
      userId: doc.userId,
      originalName: doc.originalName,
    },
    ipAddress: getClientIp(req),
  });

  try {
    const buffer = await readFile(getKycAbsolutePath(doc.storagePath));
    const safeName = doc.originalName.replace(/[^\w.\-àâäéèêëïîôùûüç ]/gi, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}

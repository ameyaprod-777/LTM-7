import { prisma } from "@/lib/prisma";
import { deleteKycStorage, deleteUserKycFolder } from "@/lib/kyc-storage";

const REJECTED_RETENTION_DAYS = 30;
const DEPARTED_MEMBER_RETENTION_DAYS = 180;

export function scheduleKycPurgeAfterReject(applicationId: string) {
  const kycPurgeAt = new Date();
  kycPurgeAt.setDate(kycPurgeAt.getDate() + REJECTED_RETENTION_DAYS);
  return prisma.membershipApplication.update({
    where: { id: applicationId },
    data: { kycPurgeAt },
  });
}

export function scheduleKycPurgeAfterMemberDeparture(userId: string) {
  const kycPurgeAt = new Date();
  kycPurgeAt.setDate(kycPurgeAt.getDate() + DEPARTED_MEMBER_RETENTION_DAYS);
  return prisma.membershipApplication.updateMany({
    where: { userId },
    data: { kycPurgeAt },
  });
}

export async function purgeDueKycDocuments() {
  const now = new Date();
  const due = await prisma.membershipApplication.findMany({
    where: {
      kycPurgeAt: { lte: now },
      kycDocuments: { some: {} },
      OR: [
        { status: "REJECTED" },
        {
          status: "APPROVED",
          user: { role: "PENDING" },
        },
      ],
    },
    include: { kycDocuments: true },
  });

  let purged = 0;

  for (const app of due) {
    for (const doc of app.kycDocuments) {
      await deleteKycStorage(doc.storagePath);
    }
    await prisma.kycDocument.deleteMany({
      where: { applicationId: app.id },
    });
    await prisma.membershipApplication.update({
      where: { id: app.id },
      data: { kycPurgeAt: null },
    });
    purged += app.kycDocuments.length;
  }

  return { applications: due.length, documents: purged };
}

export async function purgeKycForUser(userId: string) {
  const docs = await prisma.kycDocument.findMany({ where: { userId } });
  for (const doc of docs) {
    await deleteKycStorage(doc.storagePath);
  }
  await prisma.kycDocument.deleteMany({ where: { userId } });
  await deleteUserKycFolder(userId);
}

import { prisma } from "@/lib/prisma";

export async function deleteUserAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  await prisma.$transaction(async (tx) => {
    await tx.listing.updateMany({
      where: { ownerId: userId, status: { not: "REMOVED" } },
      data: { status: "REMOVED" },
    });

    await tx.service.updateMany({
      where: { ownerId: userId, status: { not: "REMOVED" } },
      data: { status: "REMOVED" },
    });

    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted.${userId}@louetonmatos.invalid`,
        name: "Compte supprimé",
        passwordHash: null,
        image: null,
        bio: null,
        city: null,
        neighborhood: null,
        portfolioUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        status: "BANNED",
        role: "PENDING",
        verifiedIdentity: false,
        kycVerifiedAt: null,
        identityExpiresAt: null,
        emailVerified: null,
        stripeAccountId: null,
      },
    });
  });
}

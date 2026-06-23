import { prisma } from "@/lib/prisma";

export type UserReviewStats = {
  avgRating: number | null;
  reviewCount: number;
  avgEquipmentRating: number | null;
  equipmentReviewCount: number;
};

export async function getUserReviewStats(userId: string): Promise<UserReviewStats> {
  const baseWhere = { targetId: userId, flagged: false };

  const [person, equipment] = await Promise.all([
    prisma.review.aggregate({
      where: baseWhere,
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.review.aggregate({
      where: { ...baseWhere, equipmentRating: { not: null } },
      _avg: { equipmentRating: true },
      _count: { id: true },
    }),
  ]);

  return {
    avgRating: person._avg.rating,
    reviewCount: person._count.id,
    avgEquipmentRating: equipment._avg.equipmentRating,
    equipmentReviewCount: equipment._count.id,
  };
}

import { CreativeDomain, type Prisma } from "@prisma/client";

export type MembersSearchParams = {
  q?: string;
  domain?: string;
  city?: string;
};

export function buildMembersWhere(
  params: MembersSearchParams
): Prisma.UserWhereInput {
  const q = params.q?.trim();
  const city = params.city?.trim();

  const where: Prisma.UserWhereInput = {
    status: "ACTIVE",
    role: { in: ["MEMBER", "ADMIN"] },
  };

  if (
    params.domain &&
    Object.values(CreativeDomain).includes(params.domain as CreativeDomain)
  ) {
    where.creativeDomain = params.domain as CreativeDomain;
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (q) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

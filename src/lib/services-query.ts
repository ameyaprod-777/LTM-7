import { ServiceCategory, type Prisma } from "@prisma/client";

export type ServicesSearchParams = {
  q?: string;
  category?: string;
  city?: string;
  sort?: string;
};

export function buildServicesWhere(
  params: ServicesSearchParams
): Prisma.ServiceWhereInput {
  const q = params.q?.trim();
  const city = params.city?.trim();

  const where: Prisma.ServiceWhereInput = {
    status: "ACTIVE",
  };

  if (
    params.category &&
    Object.values(ServiceCategory).includes(params.category as ServiceCategory)
  ) {
    where.category = params.category as ServiceCategory;
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (q) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { neighborhood: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

export function buildServicesOrderBy(
  sort?: string
): Prisma.ServiceOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { priceAmount: "asc" };
    case "price_desc":
      return { priceAmount: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

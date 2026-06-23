import { ListingCategory, type Prisma } from "@prisma/client";

export type ListingsSearchParams = {
  q?: string;
  category?: string;
  city?: string;
  sort?: string;
};

export function buildListingsWhere(
  params: ListingsSearchParams
): Prisma.ListingWhereInput {
  const q = params.q?.trim();
  const city = params.city?.trim();

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
  };

  if (
    params.category &&
    Object.values(ListingCategory).includes(params.category as ListingCategory)
  ) {
    where.category = params.category as ListingCategory;
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

export function buildListingsOrderBy(
  sort?: string
): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { pricePerDay: "asc" };
    case "price_desc":
      return { pricePerDay: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

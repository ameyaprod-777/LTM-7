import type { Prisma } from "@prisma/client";

export function normalizeTagName(name: string) {
  return name.trim().toLowerCase().slice(0, 40);
}

export async function syncListingTags(
  tx: Prisma.TransactionClient,
  listingId: string,
  tagNames: string[] | undefined
) {
  if (tagNames === undefined) return;

  const unique = Array.from(
    new Set(tagNames.map(normalizeTagName).filter(Boolean))
  ).slice(0, 8);

  await tx.listingTag.deleteMany({ where: { listingId } });

  for (const name of unique) {
    const tag = await tx.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    await tx.listingTag.create({
      data: { listingId, tagId: tag.id },
    });
  }
}

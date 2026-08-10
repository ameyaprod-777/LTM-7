/**
 * Réécrit les URLs photos absolues (localhost / ancien domaine) en chemins relatifs.
 *
 * Usage (local ou VPS) :
 *   npm run db:fix-media-urls
 */

import { PrismaClient } from "@prisma/client";
import { toSameOriginMediaUrl } from "../src/lib/upload-root";

const prisma = new PrismaClient();

async function fixTable(
  label: string,
  rows: { id: string; url: string }[],
  update: (id: string, url: string) => Promise<unknown>
) {
  let n = 0;
  for (const row of rows) {
    const next = toSameOriginMediaUrl(row.url);
    if (next && next !== row.url) {
      await update(row.id, next);
      n += 1;
      console.log(`  ${label} ${row.id}: ${row.url.slice(0, 60)}… → ${next}`);
    }
  }
  console.log(`✓ ${label}: ${n} URL(s) corrigée(s) / ${rows.length}`);
}

async function main() {
  console.log("Base :", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

  const listingPhotos = await prisma.listingPhoto.findMany({
    select: { id: true, url: true },
  });
  await fixTable("ListingPhoto", listingPhotos, (id, url) =>
    prisma.listingPhoto.update({ where: { id }, data: { url } })
  );

  const servicePhotos = await prisma.servicePhoto.findMany({
    select: { id: true, url: true },
  });
  await fixTable("ServicePhoto", servicePhotos, (id, url) =>
    prisma.servicePhoto.update({ where: { id }, data: { url } })
  );

  const users = await prisma.user.findMany({
    where: { image: { not: null } },
    select: { id: true, image: true },
  });
  let u = 0;
  for (const user of users) {
    if (!user.image) continue;
    const next = toSameOriginMediaUrl(user.image);
    if (next && next !== user.image) {
      await prisma.user.update({ where: { id: user.id }, data: { image: next } });
      u += 1;
    }
  }
  console.log(`✓ User.image: ${u} URL(s) corrigée(s)`);

  console.log("\nTerminé. Les images doivent maintenant charger en same-origin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

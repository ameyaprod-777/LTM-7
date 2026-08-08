/**
 * Marque les migrations Prisma comme déjà appliquées sur une base
 * synchronisée via `prisma db push` (dev local).
 *
 * Usage (base déjà à jour avec schema.prisma) :
 *   npm run db:baseline
 *
 * Ne pas utiliser sur une base fraîche — préférez `npm run db:migrate:deploy`.
 */

import { PrismaClient } from "@prisma/client";

const MIGRATIONS = [
  "20260101000000_init",
  "20260808120000_stripe_identity_booking_completion",
];

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);

  for (const name of MIGRATIONS) {
    const existing = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE migration_name = ${name}
      LIMIT 1
    `;
    if (existing.length > 0) {
      console.log(`→ Déjà baselinée : ${name}`);
      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      ) VALUES (
        gen_random_uuid()::text,
        'baseline',
        NOW(),
        ${name},
        NULL,
        NULL,
        NOW(),
        1
      )
    `;
    console.log(`✓ Baselinée : ${name}`);
  }

  console.log("\nTerminé. Vérifiez avec : npx prisma migrate status");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

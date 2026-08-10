/**
 * Marque les migrations déjà reflétées dans le schéma comme « appliquées »
 * (base créée via `db push` ou sans historique `_prisma_migrations`).
 *
 * Usage (prod / VPS quand `migrate deploy` renvoie P3005) :
 *   npm run db:baseline
 *   npx prisma migrate deploy
 *
 * → Les migrations listées ci-dessous sont baselinées.
 * → Les migrations plus récentes (ex. videoUrl) s’appliquent ensuite normalement.
 *
 * Ne pas baseliner une migration dont le SQL n’est PAS encore dans la DB.
 */

import { PrismaClient } from "@prisma/client";

/** Migrations déjà présentes dans le schéma prod avant les nouvelles. */
const ALREADY_IN_SCHEMA = [
  "20260101000000_init",
  "20260808120000_stripe_identity_booking_completion",
];

const prisma = new PrismaClient();

async function main() {
  console.log("Base :", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

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

  for (const name of ALREADY_IN_SCHEMA) {
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

  console.log(`
Terminé. Ensuite :

  npx prisma migrate deploy

Cela appliquera uniquement les migrations pas encore baselinées
(ex. 20260810160000_project_video_url).
`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

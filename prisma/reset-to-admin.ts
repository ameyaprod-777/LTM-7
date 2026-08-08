/**
 * ⚠️  DESTRUCTEUR — Vide toutes les tables et recrée uniquement le compte admin.
 *
 * Usage :
 *   npm run db:reset:admin              (bloqué en production sans FORCE_RESET=1)
 *   FORCE_RESET=1 npm run db:reset:admin (contourne la protection)
 *
 * L'admin créé :
 *   email    : admin@louetonmatos.fr
 *   password : Admin123!
 *   role     : ADMIN
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase() || "admin@louetonmatos.fr";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin LoueTonMatos";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.FORCE_RESET !== "1") {
    throw new Error(
      "Refus d'exécution : NODE_ENV=production. Utilisez FORCE_RESET=1 pour forcer."
    );
  }

  console.log("Base ciblée :", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  console.log("→ Toutes les tables vont être vidées.");

  // Récupère dynamiquement toutes les tables du schéma public
  // (sauf les tables système Prisma).
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations')
  `;

  if (rows.length === 0) {
    console.warn("Aucune table trouvée. Avez-vous lancé `prisma db push` ?");
  } else {
    const identifiers = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
    console.log(`TRUNCATE ${rows.length} tables…`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE;`
    );
  }

  console.log("→ Réinitialisation des paramètres plateforme…");
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", commissionRate: 0.12 },
    update: {},
  });

  console.log(`→ Création du compte admin (${ADMIN_EMAIL})…`);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      verifiedIdentity: true,
      memberSince: new Date(),
      city: "Paris",
      bio: "Compte administrateur de la plateforme.",
      creativeDomain: "OTHER",
    },
  });

  console.log("\n✅ Base réinitialisée.");
  console.log("   Admin : " + ADMIN_EMAIL + " / " + ADMIN_PASSWORD);
  console.log("   (Changez le mot de passe après votre première connexion.)");
}

main()
  .catch((e) => {
    console.error("❌ Échec :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

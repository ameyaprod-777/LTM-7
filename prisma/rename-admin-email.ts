/**
 * Renomme l’email du compte admin (sans toucher aux autres données).
 *
 * Usage :
 *   npm run db:rename-admin-email
 *
 * Variables optionnelles :
 *   OLD_ADMIN_EMAIL=admin@louetonmatos.fr
 *   NEW_ADMIN_EMAIL=support@louetonmatos.fr
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OLD_EMAIL = (
  process.env.OLD_ADMIN_EMAIL ?? "admin@louetonmatos.fr"
).toLowerCase();
const NEW_EMAIL = (
  process.env.NEW_ADMIN_EMAIL ?? "support@louetonmatos.fr"
).toLowerCase();

async function main() {
  if (OLD_EMAIL === NEW_EMAIL) {
    throw new Error("OLD_ADMIN_EMAIL et NEW_ADMIN_EMAIL sont identiques.");
  }

  console.log("Base :", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  console.log(`→ ${OLD_EMAIL}  →  ${NEW_EMAIL}`);

  const oldUser = await prisma.user.findUnique({
    where: { email: OLD_EMAIL },
    select: { id: true, email: true, role: true, name: true },
  });

  if (!oldUser) {
    const already = await prisma.user.findUnique({
      where: { email: NEW_EMAIL },
      select: { id: true, email: true, role: true },
    });
    if (already) {
      console.log(
        `✅ Rien à faire : ${NEW_EMAIL} existe déjà (role=${already.role}).`
      );
      return;
    }
    throw new Error(`Compte introuvable : ${OLD_EMAIL}`);
  }

  const conflict = await prisma.user.findUnique({
    where: { email: NEW_EMAIL },
    select: { id: true, role: true },
  });

  if (conflict && conflict.id !== oldUser.id) {
    throw new Error(
      `Impossible : ${NEW_EMAIL} est déjà utilisé par un autre compte (${conflict.id}, role=${conflict.role}).`
    );
  }

  const updated = await prisma.user.update({
    where: { id: oldUser.id },
    data: { email: NEW_EMAIL },
    select: { id: true, email: true, role: true, name: true },
  });

  console.log("✅ Email admin mis à jour :");
  console.log(`   ${updated.name ?? "—"} | ${updated.email} | ${updated.role}`);
  console.log("   Reconnectez-vous avec le nouvel email (même mot de passe).");
}

main()
  .catch((e) => {
    console.error("❌ Échec :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

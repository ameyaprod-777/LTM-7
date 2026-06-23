import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/auth-tokens";
import { sendEmail, emailVerificationEmail } from "@/lib/email";

export async function sendVerificationEmailForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return { ok: false as const, reason: "already_verified" as const };
  }

  if (user.email.endsWith("@louetonmatos.invalid")) {
    return { ok: false as const, reason: "deleted" as const };
  }

  const token = await createEmailVerificationToken(user.email);
  await sendEmail({
    to: user.email,
    subject: "Confirmez votre email — LoueTonMatos",
    html: emailVerificationEmail(user.name, token, user.email),
  });

  return { ok: true as const };
}

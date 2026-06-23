import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_PREFIX = "password-reset:";
const VERIFY_PREFIX = "email-verify:";

export function createTokenValue() {
  return randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(email: string) {
  const normalized = email.toLowerCase();
  const token = createTokenValue();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `${RESET_PREFIX}${normalized}` },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: `${RESET_PREFIX}${normalized}`,
      token,
      expires,
    },
  });

  return token;
}

export async function consumePasswordResetToken(email: string, token: string) {
  const normalized = email.toLowerCase();
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: `${RESET_PREFIX}${normalized}`,
      token,
      expires: { gt: new Date() },
    },
  });

  if (!record) return false;

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: record.identifier,
        token: record.token,
      },
    },
  });

  return true;
}

export async function createEmailVerificationToken(email: string) {
  const normalized = email.toLowerCase();
  const token = createTokenValue();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `${VERIFY_PREFIX}${normalized}` },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: `${VERIFY_PREFIX}${normalized}`,
      token,
      expires,
    },
  });

  return token;
}

export async function consumeEmailVerificationToken(email: string, token: string) {
  const normalized = email.toLowerCase();
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: `${VERIFY_PREFIX}${normalized}`,
      token,
      expires: { gt: new Date() },
    },
  });

  if (!record) return false;

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: record.identifier,
        token: record.token,
      },
    },
  });

  return true;
}

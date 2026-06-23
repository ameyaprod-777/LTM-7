import { prisma } from "@/lib/prisma";

export async function getPlatformSettings() {
  return prisma.platformSettings.findUnique({
    where: { id: "default" },
  });
}

export async function isRegistrationOpen() {
  const settings = await getPlatformSettings();
  return !settings?.registrationClosed;
}

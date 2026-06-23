import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  areEmailNotificationsEnabled,
  isDeliverableEmail,
  notificationEmail,
  sendEmail,
} from "@/lib/email";

async function deliverNotificationEmail({
  userId,
  title,
  body,
  link,
}: {
  userId: string;
  title: string;
  body?: string;
  link?: string;
}) {
  if (!areEmailNotificationsEnabled()) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!isDeliverableEmail(user?.email)) return;

  void sendEmail({
    to: user!.email,
    subject: `${title} — LoueTonMatos`,
    html: notificationEmail(user!.name, title, body, link),
  });
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
  sendEmailNotification = true,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  /** false si un email dédié est déjà envoyé (messages, tickets, etc.) */
  sendEmailNotification?: boolean;
}) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  if (sendEmailNotification) {
    await deliverNotificationEmail({ userId, title, body, link });
  }

  return notification;
}

export async function notifyAdmins({
  type,
  title,
  body,
  link,
  sendEmailNotification = true,
}: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  sendEmailNotification?: boolean;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true, email: true, name: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type,
      title,
      body,
      link,
    })),
  });

  if (!sendEmailNotification || !areEmailNotificationsEnabled()) return;

  for (const admin of admins) {
    if (!isDeliverableEmail(admin.email)) continue;
    void sendEmail({
      to: admin.email,
      subject: `${title} — LoueTonMatos (admin)`,
      html: notificationEmail(admin.name, title, body, link),
    });
  }
}

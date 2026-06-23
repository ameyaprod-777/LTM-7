import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { isUrgentNeed } from "@/lib/forum-query";
import { formatDateTime } from "@/lib/utils";

export async function notifyUrgentNeed(post: {
  id: string;
  title: string;
  eventAt: Date | null;
  city: string | null;
  authorId: string;
}) {
  if (!isUrgentNeed(post.eventAt)) return;

  const author = await prisma.user.findUnique({
    where: { id: post.authorId },
    select: { name: true },
  });

  const when = post.eventAt ? formatDateTime(post.eventAt) : "";
  const body = `${author?.name ?? "Un membre"} — ${when}${post.city ? ` · ${post.city}` : ""}`;

  await notifyAdmins({
    type: "ADMIN_NEW_APPLICATION",
    title: "Besoin urgent sur le fil",
    body: `${post.title} — ${body}`,
    link: `/admin/forum?highlight=${post.id}`,
  });

  const members = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: { in: ["MEMBER", "ADMIN"] },
      id: { not: post.authorId },
    },
    select: { id: true, email: true, name: true },
    take: 150,
  });

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.id,
      type: "NEW_MESSAGE" as const,
      title: "Besoin urgent — fil Actu",
      body: post.title,
      link: `/forum/${post.id}`,
    })),
  });

  const siteUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  for (const m of members) {
    if (!m.email || m.email.endsWith("@louetonmatos.invalid")) continue;
    void sendEmail({
      to: m.email,
      subject: `[Urgent] ${post.title}`,
      html: `
        <h1>Besoin urgent sur LoueTonMatos</h1>
        <p>Bonjour ${m.name ?? "Membre"},</p>
        <p><strong>${author?.name ?? "Un membre"}</strong> a publié un besoin pour <strong>${when}</strong> :</p>
        <p><em>${post.title}</em></p>
        <p><a href="${siteUrl}/forum/${post.id}">Voir sur le fil Actu</a></p>
      `,
    });
  }
}

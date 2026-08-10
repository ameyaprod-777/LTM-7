import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";
import { sendEmail, urgentForumEmail } from "@/lib/email";
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
      role: "MEMBER",
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

  for (const m of members) {
    if (!m.email || m.email.endsWith("@louetonmatos.invalid")) continue;
    void sendEmail({
      to: m.email,
      subject: `[Urgent] ${post.title}`,
      html: urgentForumEmail(
        m.name,
        author?.name ?? "Un membre",
        post.title,
        when,
        post.id
      ),
    });
  }
}

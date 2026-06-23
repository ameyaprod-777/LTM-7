import { prisma } from "@/lib/prisma";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { sendEmail, ticketStaffReplyEmail } from "@/lib/email";

export async function notifyAdminsNewTicket(ticket: {
  id: string;
  subject: string;
}) {
  await notifyAdmins({
    type: "TICKET_NEW",
    title: "Nouveau ticket support",
    body: ticket.subject,
    link: `/admin/tickets/${ticket.id}`,
  });
}

export async function notifyMemberStaffReply(ticket: {
  id: string;
  subject: string;
  userId: string;
  preview: string;
}) {
  await createNotification({
    userId: ticket.userId,
    type: "TICKET_REPLY",
    title: "Réponse sur votre ticket",
    body: ticket.subject,
    link: `/dashboard/support/${ticket.id}`,
    sendEmailNotification: false,
  });

  const user = await prisma.user.findUnique({
    where: { id: ticket.userId },
    select: { email: true, name: true },
  });

  if (!user?.email || user.email.endsWith("@louetonmatos.invalid")) return;

  void sendEmail({
    to: user.email,
    subject: `Réponse support — ${ticket.subject}`,
    html: ticketStaffReplyEmail(user.name, ticket.subject, ticket.preview, ticket.id),
  });
}

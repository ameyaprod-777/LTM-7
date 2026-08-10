import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, reviewReminderEmail } from "@/lib/email";

const REMINDER_AFTER_DAYS = 2;

export async function sendPendingReviewReminders() {
  const cutoff = subDays(new Date(), REMINDER_AFTER_DAYS);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      reviewReminderSentAt: null,
      OR: [
        { completedAt: { lte: cutoff } },
        { completedAt: null, updatedAt: { lte: cutoff } },
      ],
    },
    include: {
      listing: { select: { title: true } },
      renter: { select: { id: true, email: true, name: true } },
      lister: { select: { id: true, email: true, name: true } },
      reviews: { select: { authorId: true } },
    },
    take: 100,
  });

  let sent = 0;

  for (const booking of bookings) {
    const reviewedBy = new Set(booking.reviews.map((r) => r.authorId));
    const parties = [
      { user: booking.renter, role: "locataire" as const },
      { user: booking.lister, role: "loueur" as const },
    ];

    for (const { user, role } of parties) {
      if (reviewedBy.has(user.id)) continue;

      await createNotification({
        userId: user.id,
        type: "REVIEW_REMINDER",
        title: "Votre avis compte",
        body: `Partagez votre expérience sur « ${booking.listing.title} »`,
        link: "/dashboard/bookings",
        sendEmailNotification: false,
      });

      if (user.email && !user.email.endsWith("@louetonmatos.invalid")) {
        void sendEmail({
          to: user.email,
          subject: `Rappel — laissez un avis sur ${booking.listing.title}`,
          html: reviewReminderEmail(user.name, booking.listing.title, role),
        });
      }

      sent++;
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { reviewReminderSentAt: new Date() },
    });
  }

  return { processed: bookings.length, notifications: sent };
}

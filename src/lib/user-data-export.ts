import { prisma } from "@/lib/prisma";

/** Export RGPD — données personnelles de l'utilisateur (sans secrets). */
export async function buildUserDataExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: {
        select: { provider: true, type: true, providerAccountId: true },
      },
      application: {
        select: {
          id: true,
          status: true,
          motivation: true,
          adminNotes: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      listings: {
        select: {
          id: true,
          title: true,
          status: true,
          city: true,
          pricePerDay: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      services: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      },
      bookingsAsRenter: {
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          totalAmount: true,
          createdAt: true,
          listing: { select: { title: true } },
        },
      },
      bookingsAsLister: {
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          totalAmount: true,
          createdAt: true,
          listing: { select: { title: true } },
        },
      },
      reviewsGiven: {
        select: {
          id: true,
          rating: true,
          comment: true,
          equipmentRating: true,
          createdAt: true,
        },
      },
      reviewsReceived: {
        select: {
          id: true,
          rating: true,
          comment: true,
          response: true,
          createdAt: true,
        },
      },
      notifications: {
        select: {
          type: true,
          title: true,
          body: true,
          read: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      },
      supportTickets: {
        select: {
          id: true,
          subject: true,
          category: true,
          status: true,
          createdAt: true,
        },
      },
      forumPosts: {
        select: {
          id: true,
          title: true,
          section: true,
          createdAt: true,
        },
      },
      projects: {
        select: {
          id: true,
          title: true,
          tags: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return null;

  const conversations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: {
      conversation: {
        select: {
          id: true,
          createdAt: true,
          messages: {
            where: { senderId: userId },
            select: {
              body: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
            take: 200,
          },
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- champs exclus de l'export
  const { passwordHash, stripeAccountId, ...profile } = user;

  return {
    exportedAt: new Date().toISOString(),
    platform: "LoueTonMatos",
    user: profile,
    conversations: conversations.map((c) => c.conversation),
    note: "Les pièces KYC ne sont pas incluses pour des raisons de sécurité. Contactez le support pour toute demande complémentaire.",
  };
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatView } from "@/components/messages/chat-view";
import { ConversationBanner } from "@/components/messages/conversation-banner";
import { ServiceQuotePaymentPanel } from "@/components/services/service-quote-payment-panel";
import { ArrowLeft, Package, Briefcase } from "lucide-react";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { booking?: string; paid?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: params.id,
      userId: session.user.id,
      archivedAt: null,
    },
  });
  if (!participant) redirect("/dashboard/messages");

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true } } },
      },
      booking: {
        include: {
          listing: { select: { id: true, title: true } },
        },
      },
      service: { select: { id: true, title: true } },
    },
  });

  const other = conversation?.participants.find(
    (p) => p.userId !== session.user.id
  )?.user;

  const serviceQuote = await prisma.serviceQuote.findFirst({
    where: { conversationId: params.id },
    include: {
      payment: true,
      service: { select: { title: true, priceAmount: true } },
    },
  });

  const stripePaymentsEnabled = !!process.env.STRIPE_SECRET_KEY;

  const title =
    conversation?.booking?.listing.title ??
    conversation?.service?.title ??
    other?.name ??
    "Conversation";

  return (
    <div>
      <Link
        href="/dashboard/messages"
        className="mb-4 inline-flex items-center gap-2 text-sm text-anthracite-500 hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Messages
      </Link>

      <ConversationBanner
        bookingConfirmed={searchParams.booking === "confirmed"}
        paid={searchParams.paid === "1"}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-anthracite">{title}</h1>
          {other && (
            <p className="mt-1 text-sm text-anthracite-500">
              avec {other.name}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {conversation?.booking?.listing && (
            <Link
              href={`/listings/${conversation.booking.listing.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-anthracite-200 px-3 py-1.5 text-sm text-anthracite-600 hover:bg-anthracite-50"
            >
              <Package className="h-4 w-4" />
              Voir l&apos;annonce
            </Link>
          )}
          {conversation?.service && (
            <Link
              href={`/services/${conversation.service.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-anthracite-200 px-3 py-1.5 text-sm text-anthracite-600 hover:bg-anthracite-50"
            >
              <Briefcase className="h-4 w-4" />
              Voir le service
            </Link>
          )}
        </div>
      </div>

      {serviceQuote?.clientId === session.user.id &&
        serviceQuote.status === "ACCEPTED" && (
          <div className="mt-4">
            <ServiceQuotePaymentPanel
              quoteId={serviceQuote.id}
              status={serviceQuote.status}
              serviceTitle={serviceQuote.service.title}
              proposedAmount={serviceQuote.proposedAmount}
              servicePriceAmount={serviceQuote.service.priceAmount}
              agreedPaymentTiming={serviceQuote.agreedPaymentTiming}
              payment={
                serviceQuote.payment
                  ? {
                      status: serviceQuote.payment.status,
                      method: serviceQuote.payment.method,
                      clientDeclaredCashAt:
                        serviceQuote.payment.clientDeclaredCashAt?.toISOString() ??
                        null,
                    }
                  : null
              }
              stripePaymentsEnabled={stripePaymentsEnabled}
            />
          </div>
        )}

      <div className="mt-6">
        <ChatView
          conversationId={params.id}
          currentUserId={session.user.id}
          pusherKey={process.env.NEXT_PUBLIC_PUSHER_KEY ?? null}
          pusherCluster={process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu"}
        />
      </div>
    </div>
  );
}

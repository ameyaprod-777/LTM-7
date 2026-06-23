import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewTicketForm } from "@/components/support/new-ticket-form";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/ticket";

export const metadata = { title: "Support" };

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Support</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Contactez l&apos;équipe — réponse par email et sur cette page.
      </p>

      <NewTicketForm />

      <ul className="mt-8 space-y-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              href={`/dashboard/support/${t.id}`}
              className="block rounded-lg border border-anthracite-100 p-3 hover:bg-anthracite-50"
            >
              <span className="font-medium text-anthracite">{t.subject}</span>
              <span className="ml-2 text-xs text-anthracite-400">
                {TICKET_STATUS_LABELS[t.status]}
              </span>
              <span className="ml-2 text-xs text-anthracite-400">
                · {TICKET_CATEGORY_LABELS[t.category]}
              </span>
            </Link>
          </li>
        ))}
        {tickets.length === 0 && (
          <p className="text-sm text-anthracite-400">Aucun ticket ouvert.</p>
        )}
      </ul>
    </div>
  );
}

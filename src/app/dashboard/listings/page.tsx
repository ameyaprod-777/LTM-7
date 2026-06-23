import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ListingRowActions } from "@/components/dashboard/listing-row-actions";
import { Package, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Mes annonces" };

export default async function DashboardListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const listings = await prisma.listing.findMany({
    where: { ownerId: session.user.id, status: { not: "REMOVED" } },
    include: {
      photos: { take: 1 },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-anthracite">Mes annonces</h1>
        <Link href="/listings/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle annonce
          </Button>
        </Link>
      </div>
      <div className="mt-8 space-y-3">
        {listings.map((l) => {
          const rate =
            l.viewCount > 0
              ? Math.round((l._count.bookings / l.viewCount) * 100)
              : 0;
          return (
            <div
              key={l.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-anthracite-100 p-4"
            >
              <div>
                <Link
                  href={`/listings/${l.id}`}
                  className="font-medium hover:text-accent"
                >
                  {l.title}
                </Link>
                <p className="text-sm text-anthracite-500">
                  {formatCents(l.pricePerDay)} / jour ·{" "}
                  {LISTING_STATUS_LABELS[l.status]} · {l._count.bookings}{" "}
                  réservation{l._count.bookings !== 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-xs text-anthracite-400">
                  {l.viewCount} vues · {rate} % conversion
                </p>
              </div>
              <ListingRowActions
                listingId={l.id}
                title={l.title}
                status={l.status}
              />
            </div>
          );
        })}
        {listings.length === 0 && (
          <EmptyState
            icon={Package}
            title="Aucune annonce publiée"
            description="Proposez votre matériel à la communauté en quelques minutes."
            action={{ href: "/listings/new", label: "Publier ma première annonce" }}
          />
        )}
      </div>
    </div>
  );
}

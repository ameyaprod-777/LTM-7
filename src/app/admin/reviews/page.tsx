import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/staff";
import { AdminReviewsTable } from "@/components/admin/admin-reviews-table";

export const metadata = { title: "Modération — Avis" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { flagged?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/");

  const onlyFlagged = searchParams.flagged === "1";
  const q = searchParams.q?.trim();

  const reviews = await prisma.review.findMany({
    where: {
      ...(onlyFlagged ? { flagged: true } : {}),
      ...(q
        ? {
            OR: [
              { comment: { contains: q, mode: "insensitive" } },
              { equipmentComment: { contains: q, mode: "insensitive" } },
              { flagReason: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      author: { select: { name: true, email: true } },
      target: { select: { id: true, name: true } },
      booking: { select: { listing: { select: { title: true } } } },
    },
    orderBy: [{ flagged: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Modération — Avis</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Traiter les signalements, retirer ou supprimer les avis inappropriés.
      </p>

      <form className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher…"
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="flagged" value="1" defaultChecked={onlyFlagged} />
          Signalés uniquement
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </form>

      <AdminReviewsTable
        reviews={reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

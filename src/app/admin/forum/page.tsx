import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/staff";
import { AdminForumTable } from "@/components/admin/admin-forum-table";
import { ForumPostType } from "@prisma/client";

export const metadata = { title: "Modération — Fil Actu" };

export default async function AdminForumPage({
  searchParams,
}: {
  searchParams: { flagged?: string; type?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!isStaffRole(session?.user?.role)) redirect("/");

  const onlyFlagged = searchParams.flagged === "1";
  const type = searchParams.type as ForumPostType | undefined;
  const q = searchParams.q?.trim();

  const posts = await prisma.forumPost.findMany({
    where: {
      ...(onlyFlagged ? { flagged: true } : {}),
      ...(type && Object.values(ForumPostType).includes(type) ? { postType: type } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { replies: true, reports: true } },
    },
    orderBy: [{ flagged: "desc" }, { pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Modération — Fil Actu</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Épingler, verrouiller ou supprimer les publications. Traiter les signalements.
      </p>

      <form className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher…"
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="ACTU">Actu</option>
          <option value="PROJECT">Projet</option>
          <option value="NEED">Besoin</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="flagged" value="1" defaultChecked={onlyFlagged} />
          Signalées uniquement
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </form>

      <AdminForumTable
        posts={posts.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

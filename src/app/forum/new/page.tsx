import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/session";
import { canPostForum } from "@/lib/permissions";
import { NewPostForm } from "@/components/forum/new-post-form";
import { ForumPostType } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Nouvelle publication" };

export default async function NewForumPostPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const { tier } = await getAccessContext();
  if (!canPostForum(tier)) redirect("/forum");

  const defaultType =
    searchParams.type &&
    Object.values(ForumPostType).includes(searchParams.type as ForumPostType)
      ? (searchParams.type as ForumPostType)
      : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 text-sm text-anthracite-500 hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au fil
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-anthracite">Nouvelle publication</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Actu, partage de projet ou besoin de matériel
      </p>
      <div className="mt-8">
        <NewPostForm defaultType={defaultType} />
      </div>
    </div>
  );
}

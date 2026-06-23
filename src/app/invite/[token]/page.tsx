import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Gift } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const session = await getServerSession(authOptions);
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { createdBy: { select: { name: true } } },
  });

  const valid =
    invitation &&
    !invitation.usedAt &&
    invitation.expiresAt > new Date();

  if (session?.user) {
    if (valid) {
      redirect(`/apply?invite=${params.token}`);
    }
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted text-accent">
        <Gift className="h-8 w-8" />
      </span>

      {!valid ? (
        <>
          <h1 className="mt-6 text-2xl font-bold text-anthracite">
            Invitation invalide
          </h1>
          <p className="mt-2 text-anthracite-500">
            Ce lien a expiré ou a déjà été utilisé.
          </p>
          <Link href="/register" className="mt-8">
            <Button>Créer un compte</Button>
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-2xl font-bold text-anthracite">
            Vous êtes invité·e !
          </h1>
          <p className="mt-2 text-anthracite-500">
            <strong>{invitation.createdBy.name ?? "Un membre"}</strong> vous invite
            à rejoindre LoueTonMatos — la communauté de location audiovisuelle entre
            créatifs.
          </p>
          <Link
            href={`/register?invite=${params.token}`}
            className="mt-8 block"
          >
            <Button size="lg">Accepter l&apos;invitation</Button>
          </Link>
          <p className="mt-4 text-xs text-anthracite-400">
            Lien valable jusqu&apos;au{" "}
            {new Intl.DateTimeFormat("fr-FR").format(invitation.expiresAt)}
          </p>
        </>
      )}
    </div>
  );
}

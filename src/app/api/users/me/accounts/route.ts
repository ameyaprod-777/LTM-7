import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const [accounts, user] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true, providerAccountId: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    }),
  ]);

  return NextResponse.json({
    accounts,
    hasPassword: !!user?.passwordHash,
  });
}

export async function DELETE(req: Request) {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const { provider } = await req.json();

  if (provider !== "google") {
    return NextResponse.json({ error: "Fournisseur invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  const googleAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  if (!googleAccount) {
    return NextResponse.json({ error: "Compte Google non lié" }, { status: 404 });
  }

  if (!user?.passwordHash) {
    return NextResponse.json(
      {
        error:
          "Ajoutez d'abord un mot de passe avant de déconnecter Google (mot de passe oublié).",
      },
      { status: 400 }
    );
  }

  await prisma.account.delete({
    where: {
      provider_providerAccountId: {
        provider: googleAccount.provider,
        providerAccountId: googleAccount.providerAccountId,
      },
    },
  });

  return NextResponse.json({ ok: true });
}

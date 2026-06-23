import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getApiSession, unauthorized } from "@/lib/api-auth";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { deleteAccountSchema } from "@/lib/validations/auth";
import { deleteUserAccount } from "@/lib/account-deletion";

export async function GET() {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      accounts: { select: { provider: true } },
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = { ...parsed.data };
  if (data.city === "") data.city = undefined;
  if (data.neighborhood === "") data.neighborhood = undefined;
  if (data.bio === "") data.bio = undefined;
  if (data.image === "") data.image = undefined;
  if (data.portfolioUrl === "") data.portfolioUrl = undefined;
  if (data.websiteUrl === "") data.websiteUrl = undefined;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json(user);
}

export async function DELETE(req: Request) {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const body = await req.json();
  const parsed = deleteAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  if (user.passwordHash) {
    if (!parsed.data.password) {
      return NextResponse.json(
        { error: "Mot de passe requis pour confirmer la suppression" },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 400 }
      );
    }
  }

  await deleteUserAccount(session.user.id);

  return NextResponse.json({ ok: true });
}

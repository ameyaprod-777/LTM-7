import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations/auth";
import { consumeEmailVerificationToken } from "@/lib/auth-tokens";

async function isEmailAlreadyVerified(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });
  return Boolean(user?.emailVerified);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const { token } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    // Déjà vérifié (double clic, préfetch email, React Strict Mode, etc.)
    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const valid = await consumeEmailVerificationToken(email, token);

    if (valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    // Token déjà consommé par une requête concurrente : attendre sa MAJ user
    for (let i = 0; i < 5; i++) {
      if (await isEmailAlreadyVerified(email)) {
        return NextResponse.json({ ok: true, alreadyVerified: true });
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    return NextResponse.json(
      { error: "Lien expiré ou invalide." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

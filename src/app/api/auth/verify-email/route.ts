import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations/auth";
import { consumeEmailVerificationToken } from "@/lib/auth-tokens";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
    }

    const { email, token } = parsed.data;
    const valid = await consumeEmailVerificationToken(email, token);

    if (!valid) {
      return NextResponse.json(
        { error: "Lien expiré ou invalide." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

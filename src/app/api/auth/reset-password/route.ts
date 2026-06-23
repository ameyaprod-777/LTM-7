import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { consumePasswordResetToken } from "@/lib/auth-tokens";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "resetPassword");
    if (limited) return limited;

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, token, password } = parsed.data;
    const valid = await consumePasswordResetToken(email, token);

    if (!valid) {
      return NextResponse.json(
        { error: "Lien expiré ou invalide. Demandez un nouveau lien." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.status === "BANNED") {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.session.deleteMany({ where: { userId: user.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

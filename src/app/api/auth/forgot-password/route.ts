import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createPasswordResetToken } from "@/lib/auth-tokens";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "forgotPassword");
    if (limited) return limited;

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, passwordHash: true, status: true },
    });

    if (user?.passwordHash && user.status !== "BANNED") {
      const token = await createPasswordResetToken(email);
      await sendEmail({
        to: email,
        subject: "Réinitialisation de votre mot de passe — LoueTonMatos",
        html: passwordResetEmail(user.name, token, email),
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
    });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { sendVerificationEmailForUser } from "@/lib/send-verification-email";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "resendVerification");
    if (limited) return limited;

    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      await sendVerificationEmailForUser(user.id);
    }

    return NextResponse.json({
      ok: true,
      message:
        "Si un compte non vérifié existe, un email de confirmation a été envoyé.",
    });
  } catch (error) {
    console.error("[resend-verification-public]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

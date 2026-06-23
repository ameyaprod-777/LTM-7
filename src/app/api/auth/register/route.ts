import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { isRegistrationOpen } from "@/lib/platform-settings";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendVerificationEmailForUser } from "@/lib/send-verification-email";

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "register");
    if (limited) return limited;

    if (!(await isRegistrationOpen())) {
      return NextResponse.json(
        { error: "Les inscriptions sont temporairement fermées." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "PENDING",
        emailVerified: null,
      },
    });

    try {
      await sendVerificationEmailForUser(user.id);
    } catch (emailErr) {
      console.error("[register] verification email", emailErr);
    }

    return NextResponse.json({ ok: true, verificationEmailSent: true });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

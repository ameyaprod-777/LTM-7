import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isEmailConfigured,
  isDeliverableEmail,
  sendEmail,
  testEmail,
} from "@/lib/email";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "RESEND_API_KEY manquant. Ajoutez-le dans .env.production (prod) ou .env (local), puis redémarrez l’app.",
      },
      { status: 503 }
    );
  }

  const email = session.user.email;
  if (!isDeliverableEmail(email)) {
    return NextResponse.json(
      { error: "Adresse email du compte non valide pour l'envoi." },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to: email,
    subject: "Test LoueTonMatos — emails opérationnels",
    html: testEmail(session.user.name ?? null),
  });

  if (!result.ok) {
    const message =
      result.error && typeof result.error === "object" && "message" in result.error
        ? String((result.error as { message: string }).message)
        : "Échec d'envoi Resend";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: `Email de test envoyé à ${email}. Vérifiez votre boîte de réception (et les spams).`,
  });
}

import { NextResponse } from "next/server";
import { getApiSession, unauthorized } from "@/lib/api-auth";
import { sendVerificationEmailForUser } from "@/lib/send-verification-email";

export async function POST() {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const result = await sendVerificationEmailForUser(session.user.id);

  if (result.reason === "already_verified") {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  if (!result.ok) {
    return NextResponse.json({ error: "Envoi impossible" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

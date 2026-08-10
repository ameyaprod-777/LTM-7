import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMemberApi } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  encryptIban,
  ibanLast4,
  isValidIban,
  maskIban,
  normalizeIban,
} from "@/lib/iban";

const putSchema = z.object({
  holderName: z.string().min(2, "Nom du titulaire requis").max(120),
  iban: z.string().min(15, "IBAN trop court").max(42),
});

export async function GET() {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: {
      payoutMethod: true,
      ibanLast4: true,
      ibanHolderName: true,
      ibanUpdatedAt: true,
      stripeAccountId: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const ibanReady = Boolean(user.ibanLast4 && user.ibanHolderName);
  const connectReady = Boolean(
    user.stripeAccountId &&
      user.stripeChargesEnabled &&
      user.stripePayoutsEnabled
  );

  return NextResponse.json({
    payoutMethod: user.payoutMethod,
    ibanReady,
    ibanMasked: maskIban(user.ibanLast4),
    ibanLast4: user.ibanLast4,
    ibanHolderName: user.ibanHolderName,
    ibanUpdatedAt: user.ibanUpdatedAt,
    connectReady,
    readyForPublish: ibanReady || connectReady,
  });
}

export async function PUT(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const iban = normalizeIban(parsed.data.iban);
  if (!isValidIban(iban)) {
    return NextResponse.json(
      { error: "IBAN invalide. Vérifiez le numéro (ex. FR76…)." },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: auth.session.user.id },
      data: {
        payoutMethod: "MANUAL_IBAN",
        ibanEncrypted: encryptIban(iban),
        ibanLast4: ibanLast4(iban),
        ibanHolderName: parsed.data.holderName.trim(),
        ibanUpdatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[iban PUT]", err);
    return NextResponse.json(
      {
        error:
          "Impossible d’enregistrer l’IBAN. Vérifiez IBAN_ENCRYPTION_KEY / NEXTAUTH_SECRET.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    ibanReady: true,
    ibanMasked: maskIban(ibanLast4(iban)),
    ibanLast4: ibanLast4(iban),
    ibanHolderName: parsed.data.holderName.trim(),
  });
}

export async function DELETE() {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  await prisma.user.update({
    where: { id: auth.session.user.id },
    data: {
      ibanEncrypted: null,
      ibanLast4: null,
      ibanHolderName: null,
      ibanUpdatedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
const INVITATION_DAYS = 7;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (session.user.role !== "MEMBER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Réservé aux membres" }, { status: 403 });
    }

    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.invitationsEnabled) {
      return NextResponse.json(
        { error: "Les invitations sont temporairement désactivées." },
        { status: 403 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_DAYS);

    const invitation = await prisma.invitation.create({
      data: {
        createdById: session.user.id,
        expiresAt,
      },
    });

    const link = `${process.env.NEXTAUTH_URL}/invite/${invitation.token}`;

    await createNotification({
      userId: session.user.id,
      type: "INVITATION_SENT",
      title: "Lien d'invitation créé",
      body: "Partagez ce lien avec un créatif pour l'inviter à candidater.",
      link: "/dashboard",
    });

    return NextResponse.json({
      token: invitation.token,
      link,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("[invitations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      createdBy: { select: { name: true, image: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }

  if (invitation.usedAt) {
    return NextResponse.json({ valid: false, reason: "used" });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({
    valid: true,
    inviterName: invitation.createdBy.name,
    expiresAt: invitation.expiresAt,
  });
}

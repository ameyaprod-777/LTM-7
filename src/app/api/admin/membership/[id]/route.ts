import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendEmail,
  membershipApprovedEmail,
  membershipRejectedEmail,
  membershipIncompleteEmail,
} from "@/lib/email";
import { createNotification } from "@/lib/notifications";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "incomplete", "save_notes"]),
  message: z.string().max(2000).optional(),
  adminNotes: z.string().max(5000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }

    // Vérifie que l'admin existe toujours en base (protection contre les
    // JWT stale après un reset DB : évite un P2003 sur reviewedById).
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Votre session admin est invalide. Déconnectez-vous puis reconnectez-vous.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const application = await prisma.membershipApplication.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const { action, message, adminNotes } = parsed.data;

    if (action === "save_notes") {
      await prisma.membershipApplication.update({
        where: { id: params.id },
        data: { adminNotes: adminNotes ?? null },
      });
      return NextResponse.json({ ok: true });
    }

    if (!["PENDING", "INCOMPLETE"].includes(application.status)) {
      return NextResponse.json(
        { error: "Cette demande a déjà été traitée définitivement." },
        { status: 400 }
      );
    }

    if (action === "incomplete") {
      if (!message?.trim()) {
        return NextResponse.json(
          { error: "Indiquez quelles informations sont manquantes." },
          { status: 400 }
        );
      }

      await prisma.membershipApplication.update({
        where: { id: params.id },
        data: {
          status: "INCOMPLETE",
          adminMessage: message,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });

      // Notification + email : ne doivent pas faire échouer l'action.
      try {
        await createNotification({
          userId: application.userId,
          type: "MEMBERSHIP_REJECTED",
          title: "Informations complémentaires requises",
          body: message,
          link: "/apply",
          sendEmailNotification: false,
        });
        await sendEmail({
          to: application.user.email,
          subject: "[LoueTonMatos] Complétez votre candidature",
          html: membershipIncompleteEmail(
            application.user.name ?? "Candidat",
            message
          ),
        });
      } catch (sideEffectErr) {
        console.error("[admin/membership] incomplete side-effects", sideEffectErr);
      }

      return NextResponse.json({ ok: true, status: "INCOMPLETE" });
    }

    const approved = action === "approve";

    if (approved && !application.user.verifiedIdentity) {
      return NextResponse.json(
        {
          error:
            "L'identité du candidat n'est pas vérifiée par Stripe. Impossible d'approuver.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.membershipApplication.update({
        where: { id: params.id },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          adminMessage: message ?? null,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: application.userId },
        data: {
          role: approved ? "MEMBER" : "PENDING",
          memberSince: approved ? new Date() : null,
        },
      });
    });

    const userName = application.user.name ?? "Membre";

    // Notification + email après commit : un échec Resend ne doit pas
    // faire croire que l'approbation a échoué.
    try {
      await createNotification({
        userId: application.userId,
        type: approved ? "MEMBERSHIP_APPROVED" : "MEMBERSHIP_REJECTED",
        title: approved
          ? "Bienvenue dans la communauté !"
          : "Mise à jour de votre demande",
        body: message,
        link: approved ? "/dashboard" : "/apply",
        sendEmailNotification: false,
      });

      await sendEmail({
        to: application.user.email,
        subject: approved
          ? "[LoueTonMatos] Votre adhésion est approuvée"
          : "[LoueTonMatos] Mise à jour de votre demande",
        html: approved
          ? membershipApprovedEmail(userName)
          : membershipRejectedEmail(userName, message),
      });
    } catch (sideEffectErr) {
      console.error("[admin/membership] side-effects", sideEffectErr);
    }

    return NextResponse.json({
      ok: true,
      status: approved ? "APPROVED" : "REJECTED",
    });
  } catch (error) {
    console.error("[admin/membership]", error);
    const message =
      error instanceof Error && process.env.NODE_ENV === "development"
        ? `Erreur serveur : ${error.message}`
        : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

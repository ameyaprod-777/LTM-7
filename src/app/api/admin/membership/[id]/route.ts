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
import { scheduleKycPurgeAfterReject } from "@/lib/kyc-purge";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "incomplete", "save_notes"]),
  message: z.string().max(2000).optional(),
  adminNotes: z.string().max(5000).optional(),
  identityExpiresAt: z.string().optional(),
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

    const { action, message, adminNotes, identityExpiresAt } = parsed.data;

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
          { error: "Indiquez quelles pièces sont manquantes." },
          { status: 400 }
        );
      }

      await prisma.membershipApplication.update({
        where: { id: params.id },
        data: {
          status: "INCOMPLETE",
          adminMessage: message,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      });

      await createNotification({
        userId: application.userId,
        type: "MEMBERSHIP_REJECTED",
        title: "Pièces complémentaires requises",
        body: message,
        link: "/apply",
      });

      await sendEmail({
        to: application.user.email,
        subject: "[LoueTonMatos] Complétez votre candidature",
        html: membershipIncompleteEmail(
          application.user.name ?? "Candidat",
          message
        ),
      });

      return NextResponse.json({ ok: true, status: "INCOMPLETE" });
    }

    const approved = action === "approve";

    let parsedExpiry: Date | undefined;
    if (approved && identityExpiresAt) {
      parsedExpiry = new Date(identityExpiresAt);
      if (Number.isNaN(parsedExpiry.getTime())) {
        return NextResponse.json(
          { error: "Date d'expiration invalide" },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.membershipApplication.update({
        where: { id: params.id },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          adminMessage: message,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          kycPurgeAt: approved ? null : undefined,
        },
      });

      await tx.user.update({
        where: { id: application.userId },
        data: {
          role: approved ? "MEMBER" : "PENDING",
          memberSince: approved ? new Date() : undefined,
          verifiedIdentity: approved,
          kycVerifiedAt: approved ? new Date() : null,
          identityExpiresAt: approved ? parsedExpiry ?? null : null,
        },
      });
    });

    if (!approved) {
      await scheduleKycPurgeAfterReject(params.id);
    }

    const userName = application.user.name ?? "Membre";

    await createNotification({
      userId: application.userId,
      type: approved ? "MEMBERSHIP_APPROVED" : "MEMBERSHIP_REJECTED",
      title: approved
        ? "Bienvenue dans la communauté !"
        : "Mise à jour de votre demande",
      body: message,
      link: approved ? "/dashboard" : "/apply",
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

    return NextResponse.json({ ok: true, status: approved ? "APPROVED" : "REJECTED" });
  } catch (error) {
    console.error("[admin/membership]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

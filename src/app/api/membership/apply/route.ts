import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { membershipApplicationSchema } from "@/lib/validations/membership";
import { sendEmail, adminNewApplicationEmail } from "@/lib/email";
import { notifyAdmins, createNotification } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";
import { parseVideoUrl } from "@/lib/video-embed";

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "kycApply");
    if (limited) return limited;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (session.user.role === "MEMBER" || session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Vous êtes déjà membre de la communauté." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, verifiedIdentity: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (!user.verifiedIdentity) {
      return NextResponse.json(
        {
          error:
            "Vous devez d'abord vérifier votre identité via Stripe Identity.",
        },
        { status: 400 }
      );
    }

    const existingApp = await prisma.membershipApplication.findUnique({
      where: { userId: user.id },
    });

    if (existingApp?.status === "PENDING") {
      return NextResponse.json(
        { error: "Votre demande est déjà en cours d'examen." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const parsed = membershipApplicationSchema.safeParse({
      ...body,
      invitationToken: body.invitationToken || undefined,
      acceptTerms: body.acceptTerms === true || body.acceptTerms === "true",
      acceptKycPolicy:
        body.acceptKycPolicy === true || body.acceptKycPolicy === "true",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let invitationId: string | undefined;

    if (data.invitationToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: data.invitationToken },
      });

      if (
        !invitation ||
        invitation.usedAt ||
        invitation.expiresAt < new Date()
      ) {
        return NextResponse.json(
          { error: "Lien d'invitation invalide ou expiré." },
          { status: 400 }
        );
      }

      invitationId = invitation.id;
    }

    const cleanedProjects = (data.recentProjects ?? []).filter(
      (p) => (p.title?.trim() || p.url?.trim() || p.description?.trim())
    );

    const applicationId = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          image: data.image || undefined,
          city: data.city,
          bio: data.bio,
          creativeDomain: data.creativeDomain,
          // Un seul champ « portfolio / site web » → synchronisé sur les deux colonnes
          portfolioUrl: data.portfolioUrl || undefined,
          websiteUrl: data.portfolioUrl || undefined,
          instagramUrl: data.instagramUrl || undefined,
        },
      });

      if (cleanedProjects.length > 0) {
        await tx.project.deleteMany({ where: { userId: user.id } });
        await tx.project.createMany({
          data: cleanedProjects.map((p) => {
            const url = p.url?.trim();
            const video = url ? parseVideoUrl(url) : null;
            const desc = p.description?.trim();
            return {
              userId: user.id,
              title: p.title?.trim() || (video?.canonicalUrl ?? url) || "Projet",
              description: desc || null,
              videoUrl: video?.canonicalUrl ?? null,
            };
          }),
        });
      }

      let appId: string;

      if (existingApp) {
        const updated = await tx.membershipApplication.update({
          where: { userId: user.id },
          data: {
            motivation: data.motivation?.trim() ||
              (invitationId ? "Candidature via invitation membre" : ""),
            status: "PENDING",
            adminMessage: null,
            reviewedAt: null,
            reviewedById: null,
            invitationId,
          },
        });
        appId = updated.id;
      } else {
        const created = await tx.membershipApplication.create({
          data: {
            userId: user.id,
            motivation:
              data.motivation?.trim() ||
              (invitationId ? "Candidature via invitation membre" : ""),
            invitationId,
          },
        });
        appId = created.id;
      }

      if (invitationId) {
        const invitation = await tx.invitation.update({
          where: { id: invitationId },
          data: {
            usedById: user.id,
            usedAt: new Date(),
          },
          select: { createdById: true },
        });

        await createNotification({
          userId: invitation.createdById,
          type: "INVITATION_ACCEPTED",
          title: "Invitation acceptée",
          body: `${data.name} a utilisé votre lien d'invitation pour candidater.`,
          link: "/dashboard",
        });
      }

      return appId;
    });

    const invitationMeta = invitationId
      ? await prisma.invitation.findUnique({
          where: { id: invitationId },
          select: {
            createdBy: { select: { id: true, name: true, email: true } },
          },
        })
      : null;

    const inviteLabel = invitationMeta?.createdBy
      ? `Invité via lien de ${invitationMeta.createdBy.name ?? invitationMeta.createdBy.email}`
      : null;

    await notifyAdmins({
      type: "ADMIN_NEW_APPLICATION",
      title: inviteLabel
        ? "Nouvelle candidature (invitation)"
        : "Nouvelle demande d'adhésion",
      body: inviteLabel
        ? `${data.name} souhaite rejoindre la communauté — ${inviteLabel}.`
        : `${data.name} souhaite rejoindre la communauté (identité vérifiée Stripe).`,
      link: "/admin/membership",
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: inviteLabel
          ? `[Invitation] Candidature — ${data.name}`
          : `Nouvelle candidature — ${data.name}`,
        html: adminNewApplicationEmail(data.name, user.email, inviteLabel),
      });
    }

    return NextResponse.json({ ok: true, applicationId });
  } catch (error) {
    console.error("[membership/apply]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

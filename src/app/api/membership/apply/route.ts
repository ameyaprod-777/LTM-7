import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { KycDocumentType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { membershipApplicationSchema } from "@/lib/validations/membership";
import {
  getRequiredKycTypes,
  type KycIdentityType,
} from "@/lib/validations/kyc";
import {
  saveKycFile,
  deleteKycStorage,
  validateKycFile,
} from "@/lib/kyc-storage";
import { sendEmail, adminNewApplicationEmail } from "@/lib/email";
import { notifyAdmins, createNotification } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";

const FILE_FIELD_MAP: Record<
  KycDocumentType,
  string
> = {
  ID_CARD_FRONT: "idCardFront",
  ID_CARD_BACK: "idCardBack",
  PASSPORT: "passport",
  DRIVERS_LICENSE: "driversLicense",
  PROOF_OF_ADDRESS: "proofOfAddress",
  OTHER: "otherDocument",
};

function getFile(formData: FormData, field: string): File | null {
  const value = formData.get(field);
  if (value instanceof File && value.size > 0) return value;
  return null;
}

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

    const existingApp = await prisma.membershipApplication.findUnique({
      where: { userId: session.user.id },
      include: { kycDocuments: true },
    });

    if (existingApp?.status === "PENDING") {
      return NextResponse.json(
        { error: "Votre demande est déjà en cours d'examen." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const raw = {
      name: String(formData.get("name") ?? ""),
      image: String(formData.get("image") ?? ""),
      city: String(formData.get("city") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      motivation: String(formData.get("motivation") ?? ""),
      creativeDomain: String(formData.get("creativeDomain") ?? ""),
      portfolioUrl: String(formData.get("portfolioUrl") ?? ""),
      instagramUrl: String(formData.get("instagramUrl") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
      invitationToken: String(formData.get("invitationToken") ?? ""),
      kycIdentityType: String(formData.get("kycIdentityType") ?? ""),
      acceptTerms:
        formData.get("acceptTerms") === "true" ||
        formData.get("acceptTerms") === "on",
      acceptKycPolicy:
        formData.get("acceptKycPolicy") === "true" ||
        formData.get("acceptKycPolicy") === "on",
    };

    const parsed = membershipApplicationSchema.safeParse({
      ...raw,
      invitationToken: raw.invitationToken || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const identityType = data.kycIdentityType as KycIdentityType;
    const requiredTypes = getRequiredKycTypes(identityType);

    const filesToSave: { type: KycDocumentType; file: File }[] = [];
    for (const type of requiredTypes) {
      const field = FILE_FIELD_MAP[type];
      const file = getFile(formData, field);
      if (!file) {
        return NextResponse.json(
          {
            error: {
              kyc: [`Pièce d'identité requise : ${field}`],
            },
          },
          { status: 400 }
        );
      }
      const validationError = validateKycFile(file);
      if (validationError) {
        return NextResponse.json(
          { error: { kyc: [validationError] } },
          { status: 400 }
        );
      }
      filesToSave.push({ type, file });
    }

    const optionalTypes: KycDocumentType[] = ["PROOF_OF_ADDRESS", "OTHER"];
    for (const type of optionalTypes) {
      const file = getFile(formData, FILE_FIELD_MAP[type]);
      if (file) {
        const validationError = validateKycFile(file);
        if (validationError) {
          return NextResponse.json(
            { error: { kyc: [validationError] } },
            { status: 400 }
          );
        }
        filesToSave.push({ type, file });
      }
    }

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

    const savedFiles = await Promise.all(
      filesToSave.map(async ({ type, file }) => {
        const stored = await saveKycFile(session.user.id, file);
        return { type, ...stored };
      })
    );

    let applicationId: string;

    try {
      applicationId = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            name: data.name,
            image: data.image || undefined,
            city: data.city,
            bio: data.bio,
            creativeDomain: data.creativeDomain,
            portfolioUrl: data.portfolioUrl || undefined,
            instagramUrl: data.instagramUrl || undefined,
            websiteUrl: data.websiteUrl || undefined,
          },
        });

        let appId: string;

        if (existingApp) {
          const updated = await tx.membershipApplication.update({
            where: { userId: session.user.id },
            data: {
              motivation: data.motivation,
              status: "PENDING",
              adminMessage: null,
              reviewedAt: null,
              reviewedById: null,
              kycPurgeAt: null,
              invitationId,
            },
          });
          appId = updated.id;

          const oldDocs = await tx.kycDocument.findMany({
            where: { applicationId: appId },
          });
          await tx.kycDocument.deleteMany({ where: { applicationId: appId } });
          for (const doc of oldDocs) {
            await deleteKycStorage(doc.storagePath);
          }
        } else {
          const created = await tx.membershipApplication.create({
            data: {
              userId: session.user.id,
              motivation: data.motivation,
              invitationId,
            },
          });
          appId = created.id;
        }

        await tx.kycDocument.createMany({
          data: savedFiles.map((f) => ({
            applicationId: appId,
            userId: session.user.id,
            type: f.type,
            originalName: f.originalName,
            mimeType: f.mimeType,
            storagePath: f.storagePath,
            sizeBytes: f.sizeBytes,
          })),
        });

        if (invitationId) {
          const invitation = await tx.invitation.update({
            where: { id: invitationId },
            data: {
              usedById: session.user.id,
              usedAt: new Date(),
            },
            select: { createdById: true, createdBy: { select: { name: true } } },
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
    } catch (txError) {
      for (const f of savedFiles) {
        await deleteKycStorage(f.storagePath);
      }
      throw txError;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    await notifyAdmins({
      type: "ADMIN_NEW_APPLICATION",
      title: "Nouvelle demande d'adhésion",
      body: `${data.name} souhaite rejoindre la communauté (KYC transmis).`,
      link: "/admin/membership",
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: "[LoueTonMatos] Nouvelle demande d'adhésion",
        html: adminNewApplicationEmail(data.name, user!.email),
      });
    }

    return NextResponse.json({ ok: true, applicationId });
  } catch (error) {
    console.error("[membership/apply]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

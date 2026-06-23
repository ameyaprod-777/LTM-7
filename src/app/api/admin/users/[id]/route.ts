import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffApi } from "@/lib/api-auth";
import { isSuperAdminRole } from "@/lib/staff";
import { logAudit, getClientIp } from "@/lib/audit-log";
import { adminUserUpdateSchema } from "@/lib/validations/admin-user";
import { createNotification } from "@/lib/notifications";
import { scheduleKycPurgeAfterMemberDeparture } from "@/lib/kyc-purge";
import { deleteUserAccount } from "@/lib/account-deletion";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      application: {
        include: {
          reviewedBy: { select: { name: true } },
          invitation: true,
        },
      },
      _count: {
        select: {
          listings: true,
          bookingsAsRenter: true,
          bookingsAsLister: true,
          reviewsReceived: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  if (params.id === auth.session.user.id) {
    const body = await req.json();
    if (
      body.status === "BANNED" ||
      body.status === "SUSPENDED" ||
      (body.role && body.role !== auth.session.user.role)
    ) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas réduire vos propres droits." },
        { status: 400 }
      );
    }
  }

  const body = await req.json();
  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    include: { application: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (
    data.role &&
    (data.role === "ADMIN" || data.role === "MODERATOR") &&
    !isSuperAdminRole(auth.session.user.role)
  ) {
    return NextResponse.json(
      { error: "Seul un super-administrateur peut attribuer ce rôle." },
      { status: 403 }
    );
  }

  const wasVerified = existing.verifiedIdentity;
  const wasMember = existing.role === "MEMBER";

  const user = await prisma.$transaction(async (tx) => {
    const updateData: Parameters<typeof tx.user.update>[0]["data"] = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.neighborhood !== undefined ? { neighborhood: data.neighborhood } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
      ...(data.creativeDomain !== undefined
        ? { creativeDomain: data.creativeDomain }
        : {}),
      ...(data.portfolioUrl !== undefined
        ? { portfolioUrl: data.portfolioUrl || null }
        : {}),
      ...(data.instagramUrl !== undefined
        ? { instagramUrl: data.instagramUrl || null }
        : {}),
      ...(data.websiteUrl !== undefined
        ? { websiteUrl: data.websiteUrl || null }
        : {}),
      ...(data.verifiedIdentity !== undefined
        ? { verifiedIdentity: data.verifiedIdentity }
        : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    };

    if (data.role === "MEMBER" && existing.role !== "MEMBER") {
      updateData.memberSince = existing.memberSince ?? new Date();
      if (existing.application) {
        await tx.membershipApplication.update({
          where: { userId: params.id },
          data: {
            status: "APPROVED",
            reviewedById: auth.session.user.id,
            reviewedAt: new Date(),
          },
        });
      }
    }

    if (data.role === "PENDING" && existing.role === "MEMBER") {
      updateData.memberSince = null;
    }

    return tx.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        application: true,
        _count: {
          select: {
            listings: true,
            bookingsAsRenter: true,
            bookingsAsLister: true,
          },
        },
      },
    });
  });

  if (data.verifiedIdentity === true && !wasVerified) {
    await createNotification({
      userId: params.id,
      type: "MEMBERSHIP_APPROVED",
      title: "Identité certifiée",
      body: "Votre profil affiche désormais le badge de confiance.",
      link: `/profile/${params.id}`,
    });
  }

  if (data.role === "MEMBER" && !wasMember) {
    await createNotification({
      userId: params.id,
      type: "MEMBERSHIP_APPROVED",
      title: "Accès membre activé",
      body: "Un administrateur vous a accordé l'accès complet à la communauté.",
      link: "/dashboard",
    });
  }

  if (data.role === "PENDING" && wasMember) {
    await scheduleKycPurgeAfterMemberDeparture(params.id);
  }

  if (data.status === "SUSPENDED" || data.status === "BANNED") {
    await createNotification({
      userId: params.id,
      type: "MEMBERSHIP_REJECTED",
      title:
        data.status === "BANNED"
          ? "Compte désactivé"
          : "Compte suspendu",
      body: "Contactez le support pour plus d'informations.",
      link: "/dashboard/support",
    });
  }

  void logAudit({
    adminId: auth.session.user.id,
    action: "user.update",
    targetType: "User",
    targetId: params.id,
    metadata: { role: data.role, status: data.status },
    ipAddress: getClientIp(req),
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStaffApi();
  if ("error" in auth) return auth.error;

  if (params.id === auth.session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte depuis l'admin." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true, email: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (existing.email.endsWith("@louetonmatos.invalid")) {
    return NextResponse.json(
      { error: "Ce compte a déjà été supprimé." },
      { status: 400 }
    );
  }

  if (existing.role === "ADMIN" || existing.role === "MODERATOR") {
    return NextResponse.json(
      { error: "Impossible de supprimer un compte staff." },
      { status: 400 }
    );
  }

  try {
    await deleteUserAccount(params.id);
    void logAudit({
      adminId: auth.session.user.id,
      action: "user.delete",
      targetType: "User",
      targetId: params.id,
      ipAddress: getClientIp(_req),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/users/delete]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

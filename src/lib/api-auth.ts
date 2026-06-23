import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getAccessTier } from "@/lib/permissions";
import { isStaffRole, isSuperAdminRole } from "@/lib/staff";

export async function getApiSession() {
  return getServerSession(authOptions);
}

export function unauthorized() {
  return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
}

export function forbidden(message = "Accès refusé") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requireMemberApi() {
  const session = await getApiSession();
  if (!session?.user) return { error: unauthorized() } as const;
  const tier = getAccessTier(true, session.user.role, session.user.status);
  if (tier !== "member" && tier !== "admin") {
    return { error: forbidden("Réservé aux membres de la communauté") } as const;
  }
  return { session } as const;
}

export async function requireStaffApi() {
  const session = await getApiSession();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { error: forbidden() } as const;
  }
  return { session } as const;
}

/** Super-admin uniquement (paramètres, exports, revenus…) */
export async function requireSuperAdminApi() {
  const session = await getApiSession();
  if (!session?.user || !isSuperAdminRole(session.user.role)) {
    return { error: forbidden() } as const;
  }
  return { session } as const;
}

/** @deprecated Préférer requireStaffApi ou requireSuperAdminApi */
export async function requireAdminApi() {
  return requireSuperAdminApi();
}

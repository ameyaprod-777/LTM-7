import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessTier, type AccessTier } from "@/lib/permissions";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function getAccessContext(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  tier: AccessTier;
} | { user: null; tier: AccessTier }> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, tier: "visitor" };
  }
  return {
    user,
    tier: getAccessTier(true, user.role, user.status),
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireMember() {
  const { user, tier } = await getAccessContext();
  if (!user || (tier !== "member" && tier !== "admin")) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

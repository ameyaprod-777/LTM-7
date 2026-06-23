import type { UserRole, UserStatus } from "@prisma/client";

export type AccessTier = "visitor" | "pending" | "member" | "admin";

export function getAccessTier(
  authenticated: boolean,
  role?: UserRole,
  status?: UserStatus
): AccessTier {
  if (!authenticated) return "visitor";
  if (status === "BANNED" || status === "SUSPENDED") return "visitor";
  if (role === "ADMIN" || role === "MODERATOR") return "admin";
  if (role === "MEMBER") return "member";
  return "pending";
}

export function canBrowseListings(tier: AccessTier) {
  return tier !== "visitor";
}

export function canViewListingDetails(tier: AccessTier) {
  return tier === "member" || tier === "admin";
}

export function canViewMemberDirectory(tier: AccessTier) {
  return tier === "member" || tier === "admin";
}

export function canRent(tier: AccessTier) {
  return tier === "member" || tier === "admin";
}

export function canPostListings(tier: AccessTier) {
  return tier === "member" || tier === "admin";
}

export function canMessage(tier: AccessTier) {
  return tier === "member" || tier === "admin";
}

export function canPostForum(tier: AccessTier) {
  return tier === "member" || tier === "admin";
}

export function canViewForumFeed(tier: AccessTier) {
  return tier === "member" || tier === "admin";
}

/** @deprecated Utiliser canViewForumFeed */
export function canReadForum(tier: AccessTier) {
  return canViewForumFeed(tier);
}

export function isAdmin(tier: AccessTier) {
  return tier === "admin";
}

import type { UserRole } from "@prisma/client";

export function isStaffRole(role?: UserRole | null) {
  return role === "ADMIN" || role === "MODERATOR";
}

export function isSuperAdminRole(role?: UserRole | null) {
  return role === "ADMIN";
}

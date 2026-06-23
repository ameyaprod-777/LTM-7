import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { isStaffRole, isSuperAdminRole } from "@/lib/staff";

export function requireStaffPage(role?: UserRole | null) {
  if (!isStaffRole(role)) redirect("/login?callbackUrl=/admin");
}

export function requireSuperAdminPage(role?: UserRole | null) {
  if (!isSuperAdminRole(role)) redirect("/admin");
}

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import type { UserRole, UserStatus } from "@prisma/client";
import { apiCorsGuard } from "@/lib/cors";
import { isStaffRole } from "@/lib/staff";

const memberRoutePrefixes = [
  "/dashboard",
  "/listings/new",
  "/listings/map",
  "/services/new",
];

const adminRoutes = ["/admin"];

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as UserRole | undefined;
    const status = token?.status as UserStatus | undefined;

    if (status === "BANNED") {
      return NextResponse.redirect(new URL("/login?error=banned", req.url));
    }

    if (status === "SUSPENDED") {
      return NextResponse.redirect(new URL("/login?error=suspended", req.url));
    }

    if (adminRoutes.some((r) => path.startsWith(r))) {
      if (!isStaffRole(role)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    const isListingEdit = /^\/listings\/[^/]+\/edit/.test(path);
    const isServiceEdit = /^\/services\/[^/]+\/edit/.test(path);
    const needsMember =
      memberRoutePrefixes.some((r) => path.startsWith(r)) ||
      isListingEdit ||
      isServiceEdit;

    if (needsMember) {
      if (role !== "MEMBER" && role !== "ADMIN") {
        return NextResponse.redirect(
          new URL("/apply?reason=membership-required", req.url)
        );
      }
    }

    if (path.startsWith("/apply") && role === "MEMBER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const protectedPrefixes = [
          "/dashboard",
          "/admin",
          "/apply",
          "/api/membership",
          "/api/admin",
        ];

        const needsAuth = protectedPrefixes.some((p) => path.startsWith(p));
        if (!needsAuth) return true;
        return !!token;
      },
    },
  }
);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const corsBlock = apiCorsGuard(req);
  if (corsBlock) return corsBlock;

  return authMiddleware(
    req as Parameters<typeof authMiddleware>[0],
    event
  );
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/apply",
    "/listings/new",
    "/listings/map",
    "/listings/:path*/edit",
    "/services/new",
    "/services/:path*/edit",
    "/api/membership/:path*",
    "/api/admin/:path*",
  ],
};

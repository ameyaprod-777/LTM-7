import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import type { UserRole, UserStatus } from "@prisma/client";
import { apiCorsGuard } from "@/lib/cors";
import { isStaffRole } from "@/lib/staff";

// NB: `/dashboard` (page racine) reste accessible aux utilisateurs PENDING
// pour leur afficher les étapes d'onboarding. Les sous-pages membres sont
// listées explicitement ci-dessous et redirigent les PENDING vers `/apply`.
const memberRoutePrefixes = [
  "/dashboard/listings",
  "/dashboard/services",
  "/dashboard/bookings",
  "/dashboard/deliveries",
  "/dashboard/messages",
  "/dashboard/payments",
  "/dashboard/support",
  "/dashboard/settings",
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

    if (path.startsWith("/apply") && !token?.verifiedIdentity) {
      return NextResponse.redirect(new URL("/verify-identity", req.url));
    }

    if (path.startsWith("/verify-identity") && token?.verifiedIdentity) {
      const applyUrl = new URL("/apply", req.url);
      const invite = req.nextUrl.searchParams.get("invite");
      if (invite) applyUrl.searchParams.set("invite", invite);
      return NextResponse.redirect(applyUrl);
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
          "/verify-identity",
          "/api/membership",
          "/api/admin",
          "/api/stripe/identity",
        ];

        const needsAuth = protectedPrefixes.some((p) => path.startsWith(p));
        if (!needsAuth) return true;
        return !!token;
      },
    },
  }
);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  if (path === "/api/health" || path === "/api/health/live") {
    return NextResponse.next();
  }

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
    "/verify-identity",
    "/listings/new",
    "/listings/map",
    "/listings/:path*/edit",
    "/services/new",
    "/services/:path*/edit",
    "/api/membership/:path*",
    "/api/admin/:path*",
  ],
};

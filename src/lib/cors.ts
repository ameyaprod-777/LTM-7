import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SKIP_PREFIXES = ["/api/stripe/webhook", "/api/auth/"];

function allowedOrigins(): string[] {
  const raw = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[];

  return Array.from(new Set(raw.map((u) => u.replace(/\/$/, ""))));
}

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.replace(/\/$/, "");
  return allowedOrigins().some((a) => a === normalized);
}

/** Bloque les requêtes cross-origin non autorisées sur l'API (SEC5). */
export function apiCorsGuard(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return null;

  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return null;
  if (path === "/api/health" || path === "/api/health/live") return null;

  const origin = req.headers.get("origin");
  if (!origin) return null;

  if (isAllowedOrigin(origin)) return null;

  return NextResponse.json(
    { error: "Origine non autorisée." },
    { status: 403 }
  );
}

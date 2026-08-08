import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SKIP_PREFIXES = ["/api/stripe/webhook", "/api/auth/"];

function allowedOrigins(): string[] {
  const extra = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const raw = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    ...extra,
  ].filter(Boolean) as string[];

  return Array.from(new Set(raw.map((u) => u.replace(/\/$/, ""))));
}

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.replace(/\/$/, "");
  return allowedOrigins().some((a) => a === normalized);
}

/** Même host que la requête (ex. accès via IP:3007 pendant la mise en prod). */
function isSameHostOrigin(req: NextRequest, origin: string): boolean {
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("host");
    return Boolean(requestHost && originHost === requestHost);
  } catch {
    return false;
  }
}

/** Bloque les requêtes cross-origin non autorisées sur l'API (SEC5). */
export function apiCorsGuard(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return null;

  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return null;
  if (path === "/api/health" || path === "/api/health/live") return null;

  const origin = req.headers.get("origin");
  if (!origin) return null;

  if (isAllowedOrigin(origin) || isSameHostOrigin(req, origin)) return null;

  return NextResponse.json(
    { error: "Origine non autorisée." },
    { status: 403 }
  );
}

import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/audit-log";

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

/** Fenêtres glissantes en mémoire (instance unique). Pour cluster, utiliser Redis/Upstash. */
export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 10 },
  register: { windowMs: 60 * 60 * 1000, max: 5 },
  forgotPassword: { windowMs: 60 * 60 * 1000, max: 5 },
  resetPassword: { windowMs: 60 * 60 * 1000, max: 10 },
  resendVerification: { windowMs: 60 * 60 * 1000, max: 5 },
  geocode: { windowMs: 60 * 1000, max: 30 },
  messages: { windowMs: 60 * 1000, max: 60 },
  messageUpload: { windowMs: 60 * 1000, max: 20 },
  kycApply: { windowMs: 60 * 60 * 1000, max: 3 },
  dataExport: { windowMs: 60 * 60 * 1000, max: 3 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

function prune() {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; retryAfterSec?: number } {
  if (store.size > 10_000) prune();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return {
      success: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return { success: true };
}

export function rateLimitResponse(retryAfterSec?: number) {
  return NextResponse.json(
    { error: "Trop de requêtes. Réessayez plus tard." },
    {
      status: 429,
      headers: retryAfterSec
        ? { "Retry-After": String(retryAfterSec) }
        : undefined,
    }
  );
}

/** Limite par IP (+ suffixe optionnel). Retourne une réponse 429 ou null. */
export function enforceRateLimit(
  req: Request,
  bucket: RateLimitBucket,
  suffix = ""
): NextResponse | null {
  const ip = getClientIp(req) ?? "unknown";
  const key = `${bucket}:${ip}${suffix ? `:${suffix}` : ""}`;
  const cfg = RATE_LIMITS[bucket];
  const result = checkRateLimit(key, cfg.max, cfg.windowMs);
  if (!result.success) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}

/** Limite par clé arbitraire (ex. email login). */
export function enforceRateLimitKey(
  bucket: RateLimitBucket,
  keySuffix: string
): { ok: true } | { ok: false; message: string } {
  const key = `${bucket}:key:${keySuffix}`;
  const cfg = RATE_LIMITS[bucket];
  const result = checkRateLimit(key, cfg.max, cfg.windowMs);
  if (!result.success) {
    return {
      ok: false,
      message: "Trop de tentatives. Réessayez dans quelques minutes.",
    };
  }
  return { ok: true };
}

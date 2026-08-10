import path from "path";

/**
 * Racine des uploads disque.
 * Honore UPLOAD_ROOT (prod VPS) sinon `cwd/uploads`.
 */
export function getUploadRoot(): string {
  const fromEnv = process.env.UPLOAD_ROOT?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), "uploads");
}

/**
 * Transforme une URL photo stockée (absolue ou relative) en chemin same-origin.
 * Corrige les URLs `http://localhost:3000/...` figées en base en prod.
 */
export function toSameOriginMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) return trimmed;

  try {
    const u = new URL(trimmed);
    if (u.pathname.startsWith("/api/")) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    // ignore
  }

  // Fallback : extraire /api/... même dans une chaîne mal formée
  const idx = trimmed.indexOf("/api/");
  if (idx >= 0) return trimmed.slice(idx);

  return trimmed;
}

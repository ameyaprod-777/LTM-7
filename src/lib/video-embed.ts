/**
 * Parsing / validation des liens YouTube & Vimeo pour le portfolio projets.
 */

export type VideoProvider = "youtube" | "vimeo";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  /** URL canonique stockée en base */
  canonicalUrl: string;
  /** URL iframe (youtube-nocookie / player.vimeo) */
  embedUrl: string;
};

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

function hostname(url: URL) {
  return url.hostname.toLowerCase();
}

function youtubeIdFromUrl(url: URL): string | null {
  const host = hostname(url);
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[\w-]{6,}$/i.test(id) ? id : null;
  }
  if (!YT_HOSTS.has(host)) return null;

  if (url.pathname.startsWith("/embed/")) {
    const id = url.pathname.split("/")[2];
    return id && /^[\w-]{6,}$/i.test(id) ? id : null;
  }
  if (url.pathname.startsWith("/shorts/")) {
    const id = url.pathname.split("/")[2];
    return id && /^[\w-]{6,}$/i.test(id) ? id : null;
  }
  const v = url.searchParams.get("v");
  if (v && /^[\w-]{6,}$/i.test(v)) return v;
  return null;
}

function vimeoIdFromUrl(url: URL): string | null {
  const host = hostname(url);
  if (!VIMEO_HOSTS.has(host)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  // /123456789 ou /video/123456789
  const candidate =
    parts[0] === "video" || parts[0] === "channels"
      ? parts.find((p) => /^\d{6,}$/.test(p))
      : parts[0];
  return candidate && /^\d{6,}$/.test(candidate) ? candidate : null;
}

/** Parse une URL YouTube ou Vimeo. Retourne null si invalide. */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const yt = youtubeIdFromUrl(url);
  if (yt) {
    return {
      provider: "youtube",
      id: yt,
      canonicalUrl: `https://www.youtube.com/watch?v=${yt}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`,
    };
  }

  const vimeo = vimeoIdFromUrl(url);
  if (vimeo) {
    return {
      provider: "vimeo",
      id: vimeo,
      canonicalUrl: `https://vimeo.com/${vimeo}`,
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
    };
  }

  return null;
}

export function isYoutubeOrVimeoUrl(raw: string): boolean {
  return parseVideoUrl(raw) !== null;
}

export const VIDEO_URL_ERROR =
  "Lien YouTube ou Vimeo uniquement (ex. https://youtube.com/watch?v=… ou https://vimeo.com/…).";

export const MAX_PROFILE_PROJECTS = 3;

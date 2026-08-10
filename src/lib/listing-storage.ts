import { mkdir, writeFile, unlink, rename, copyFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { normalizeUploadImage } from "@/lib/normalize-image";
import { getUploadRoot } from "@/lib/upload-root";

const ACCEPTABLE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/*",
  "application/octet-stream",
  "",
]);

export const LISTING_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

function uploadRoot() {
  return getUploadRoot();
}

export function validateListingPhotoFile(file: File): string | null {
  const type = (file.type || "").toLowerCase();
  if (type && !ACCEPTABLE_TYPES.has(type) && !type.startsWith("image/")) {
    return "Format non accepté. Utilisez une photo (JPG, PNG, WebP ou HEIC iPhone).";
  }
  if (file.size > LISTING_PHOTO_MAX_BYTES) {
    return "Image trop volumineuse (max. 8 Mo).";
  }
  if (file.size === 0) {
    return "Fichier vide.";
  }
  return null;
}

async function writeNormalizedPhoto(
  relativeDir: string,
  file: File
): Promise<{ storagePath: string; filename: string }> {
  const err = validateListingPhotoFile(file);
  if (err) throw new Error(err);

  const raw = Buffer.from(await file.arrayBuffer());
  const { buffer, ext } = await normalizeUploadImage(raw);
  const filename = `${randomUUID()}${ext}`;
  const root = uploadRoot();
  const absoluteDir = path.join(root, relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
}

export async function saveListingPhotoFile(listingId: string, file: File) {
  return writeNormalizedPhoto(path.join("listings", listingId), file);
}

export function getListingPhotoAbsolutePath(storagePath: string): string {
  const root = uploadRoot();
  const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) {
    throw new Error("Chemin invalide");
  }
  return full;
}

export async function deleteListingPhotoFile(storagePath: string) {
  try {
    await unlink(getListingPhotoAbsolutePath(storagePath));
  } catch {
    /* absent */
  }
}

/** URL relative same-origin (pas de localhost figé en prod). */
export function listingPhotoPublicUrl(listingId: string, filename: string) {
  return `/api/listings/photos/${listingId}/${filename}`;
}

export function parseListingPhotoUrl(url: string) {
  const pathOnly = url.includes("/api/")
    ? url.slice(url.indexOf("/api/"))
    : url;
  const pending = pathOnly.match(
    /\/api\/listings\/photos\/pending\/([^/]+)\/([^/?#]+)$/
  );
  if (pending) {
    return {
      kind: "pending" as const,
      userId: pending[1]!,
      filename: pending[2]!,
    };
  }
  const match = pathOnly.match(
    /\/api\/listings\/photos\/([^/]+)\/([^/?#]+)$/
  );
  if (!match) return null;
  if (match[1] === "pending") return null;
  return {
    kind: "listing" as const,
    listingId: match[1]!,
    filename: match[2]!,
  };
}

export async function savePendingListingPhoto(userId: string, file: File) {
  return writeNormalizedPhoto(path.join("listings", "pending", userId), file);
}

export function getPendingListingPhotoAbsolutePath(
  userId: string,
  filename: string
): string {
  if (!/^[\w-]+$/.test(userId)) throw new Error("Utilisateur invalide");
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(filename)) {
    throw new Error("Fichier invalide");
  }
  const root = uploadRoot();
  const full = path.join(root, "listings", "pending", userId, filename);
  const pendingRoot = path.join(root, "listings", "pending");
  if (!full.startsWith(pendingRoot)) throw new Error("Chemin invalide");
  return full;
}

export function pendingListingPhotoPublicUrl(userId: string, filename: string) {
  return `/api/listings/photos/pending/${userId}/${filename}`;
}

/**
 * Déplace une photo pending vers le dossier de l'annonce et retourne l'URL finale.
 * Si l'URL pointe déjà vers l'annonce, la normalise en chemin relatif.
 */
export async function finalizeListingPhotoUrl(
  listingId: string,
  ownerId: string,
  rawUrl: string
): Promise<string> {
  const parsed = parseListingPhotoUrl(rawUrl);

  if (!parsed) {
    // URL externe (ex. Unsplash) — garder relative si possible
    if (rawUrl.startsWith("/")) return rawUrl;
    try {
      const u = new URL(rawUrl);
      if (u.pathname.startsWith("/api/")) return u.pathname;
    } catch {
      /* ignore */
    }
    return rawUrl;
  }

  if (parsed.kind === "listing") {
    return listingPhotoPublicUrl(parsed.listingId, parsed.filename);
  }

  // pending → move into listing folder
  if (parsed.userId !== ownerId) {
    throw new Error("Photo pending non autorisée");
  }

  const from = getPendingListingPhotoAbsolutePath(
    parsed.userId,
    parsed.filename
  );
  const destDir = path.join(uploadRoot(), "listings", listingId);
  await mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, parsed.filename);

  try {
    await rename(from, dest);
  } catch {
    await copyFile(from, dest);
    try {
      await unlink(from);
    } catch {
      /* ignore */
    }
  }

  return listingPhotoPublicUrl(listingId, parsed.filename);
}

export async function finalizeListingPhotoUrls(
  listingId: string,
  ownerId: string,
  urls: string[]
): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls) {
    out.push(await finalizeListingPhotoUrl(listingId, ownerId, url));
  }
  return out;
}

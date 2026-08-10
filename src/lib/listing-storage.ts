import { mkdir, writeFile, unlink, rename, copyFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  validateFileMagic,
  type AllowedImageMime,
} from "@/lib/file-magic";
import { getUploadRoot } from "@/lib/upload-root";

const ALLOWED_MIME: Record<AllowedImageMime, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const PHOTO_ALLOWED: AllowedImageMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const LISTING_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

function uploadRoot() {
  return getUploadRoot();
}

export function validateListingPhotoFile(file: File): string | null {
  if (!(file.type in ALLOWED_MIME)) {
    return "Format non accepté. Utilisez JPG, PNG ou WebP.";
  }
  if (file.size > LISTING_PHOTO_MAX_BYTES) {
    return "Image trop volumineuse (max. 8 Mo).";
  }
  if (file.size === 0) {
    return "Fichier vide.";
  }
  return null;
}

export async function saveListingPhotoFile(listingId: string, file: File) {
  const err = validateListingPhotoFile(file);
  if (err) throw new Error(err);

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicErr = validateFileMagic(buffer, file.type, PHOTO_ALLOWED);
  if (magicErr) throw new Error(magicErr);

  const ext = ALLOWED_MIME[file.type as AllowedImageMime];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("listings", listingId);
  const root = uploadRoot();
  const absoluteDir = path.join(root, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
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
  const err = validateListingPhotoFile(file);
  if (err) throw new Error(err);

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicErr = validateFileMagic(buffer, file.type, PHOTO_ALLOWED);
  if (magicErr) throw new Error(magicErr);

  const ext = ALLOWED_MIME[file.type as AllowedImageMime];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("listings", "pending", userId);
  const root = uploadRoot();
  const absoluteDir = path.join(root, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
}

export function getPendingListingPhotoAbsolutePath(
  userId: string,
  filename: string
): string {
  if (!/^[\w-]+$/.test(userId)) throw new Error("Utilisateur invalide");
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
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

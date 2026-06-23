import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  validateFileMagic,
  type AllowedImageMime,
} from "@/lib/file-magic";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

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
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
}

export function getListingPhotoAbsolutePath(storagePath: string): string {
  const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(UPLOAD_ROOT, normalized);
  if (!full.startsWith(UPLOAD_ROOT)) {
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

export function listingPhotoPublicUrl(listingId: string, filename: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/listings/photos/${listingId}/${filename}`;
}

export function parseListingPhotoUrl(url: string) {
  const pending = url.match(
    /\/api\/listings\/photos\/pending\/([^/]+)\/([^/?#]+)$/
  );
  if (pending) {
    return { kind: "pending" as const, userId: pending[1], filename: pending[2] };
  }
  const match = url.match(/\/api\/listings\/photos\/([^/]+)\/([^/?#]+)$/);
  if (!match) return null;
  return { kind: "listing" as const, listingId: match[1], filename: match[2] };
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
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
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
  const full = path.join(UPLOAD_ROOT, "listings", "pending", userId, filename);
  const root = path.join(UPLOAD_ROOT, "listings", "pending");
  if (!full.startsWith(root)) throw new Error("Chemin invalide");
  return full;
}

export function pendingListingPhotoPublicUrl(userId: string, filename: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/listings/photos/pending/${userId}/${filename}`;
}

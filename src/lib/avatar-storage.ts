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

const AVATAR_ALLOWED: AllowedImageMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const AVATAR_MAX_BYTES = 3 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
  if (!(file.type in ALLOWED_MIME)) {
    return "Format non accepté. Utilisez JPG, PNG ou WebP.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Image trop volumineuse (max. 3 Mo).";
  }
  if (file.size === 0) {
    return "Fichier vide.";
  }
  return null;
}

export async function saveAvatarFile(userId: string, file: File) {
  const err = validateAvatarFile(file);
  if (err) throw new Error(err);

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicErr = validateFileMagic(buffer, file.type, AVATAR_ALLOWED);
  if (magicErr) throw new Error(magicErr);

  const ext = ALLOWED_MIME[file.type as AllowedImageMime];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("avatars", userId);
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
}

export function getAvatarAbsolutePath(storagePath: string): string {
  const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(UPLOAD_ROOT, normalized);
  if (!full.startsWith(UPLOAD_ROOT)) {
    throw new Error("Chemin invalide");
  }
  return full;
}

export async function deleteAvatarFile(storagePath: string) {
  try {
    await unlink(getAvatarAbsolutePath(storagePath));
  } catch {
    /* absent */
  }
}

export function avatarPublicUrl(userId: string, filename: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/avatars/${userId}/${filename}`;
}

export function parseAvatarUrl(image: string | null | undefined) {
  if (!image) return null;
  const match = image.match(/\/api\/avatars\/([^/]+)\/([^/?#]+)$/);
  if (!match) return null;
  return { userId: match[1], filename: match[2] };
}

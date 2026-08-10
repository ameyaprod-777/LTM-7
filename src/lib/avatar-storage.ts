import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  validateFileMagic,
  resolveImageMime,
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

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
  const type = (file.type || "").toLowerCase();
  // Mobile : type souvent vide ; HEIC non supporté tel quel
  if (type === "image/heic" || type === "image/heif") {
    return "Format HEIC non supporté. Sur iPhone : Réglages → Appareil photo → Formats → « Le plus compatible », ou convertissez en JPG.";
  }
  if (type && !(type in ALLOWED_MIME) && type !== "application/octet-stream") {
    return "Format non accepté. Utilisez JPG, PNG ou WebP.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Image trop volumineuse (max. 5 Mo).";
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
  const magicErr = validateFileMagic(buffer, file.type || "", AVATAR_ALLOWED);
  if (magicErr) throw new Error(magicErr);

  const mime = resolveImageMime(buffer, file.type || "") ?? "image/jpeg";
  const ext = ALLOWED_MIME[mime];
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
  // Chemin relatif : fonctionne en local, IP:port et domaine sans mismatch d'origine
  return `/api/avatars/${userId}/${filename}`;
}

export function parseAvatarUrl(image: string | null | undefined) {
  if (!image) return null;
  const match = image.match(/\/api\/avatars\/([^/]+)\/([^/?#]+)$/);
  if (!match) return null;
  return { userId: match[1], filename: match[2] };
}

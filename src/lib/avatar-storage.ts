import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { normalizeUploadImage } from "@/lib/normalize-image";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
  const type = (file.type || "").toLowerCase();
  if (
    type &&
    !type.startsWith("image/") &&
    type !== "application/octet-stream"
  ) {
    return "Format non accepté. Utilisez JPG, PNG, WebP ou HEIC.";
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

  const raw = Buffer.from(await file.arrayBuffer());
  const { buffer, ext } = await normalizeUploadImage(raw, { maxEdge: 1024 });
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
  return `/api/avatars/${userId}/${filename}`;
}

export function parseAvatarUrl(image: string | null | undefined) {
  if (!image) return null;
  const match = image.match(/\/api\/avatars\/([^/]+)\/([^/?#]+)$/);
  if (!match) return null;
  return { userId: match[1], filename: match[2] };
}

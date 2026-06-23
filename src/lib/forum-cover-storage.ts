import { mkdir, writeFile } from "fs/promises";
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

const COVER_ALLOWED: AllowedImageMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const FORUM_COVER_MAX_BYTES = 8 * 1024 * 1024;

export function validateForumCoverFile(file: File): string | null {
  if (!(file.type in ALLOWED_MIME)) {
    return "Format non accepté. Utilisez JPG, PNG ou WebP.";
  }
  if (file.size > FORUM_COVER_MAX_BYTES) {
    return "Image trop volumineuse (max. 8 Mo).";
  }
  if (file.size === 0) {
    return "Fichier vide.";
  }
  return null;
}

export async function saveForumCoverFile(userId: string, file: File) {
  const err = validateForumCoverFile(file);
  if (err) throw new Error(err);

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicErr = validateFileMagic(buffer, file.type, COVER_ALLOWED);
  if (magicErr) throw new Error(magicErr);

  const ext = ALLOWED_MIME[file.type as AllowedImageMime];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("forum", userId);
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  await writeFile(path.join(absoluteDir, filename), buffer);

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  return {
    url: `${base.replace(/\/$/, "")}/api/forum/covers/${userId}/${filename}`,
    filename,
  };
}

export function getForumCoverAbsolutePath(userId: string, filename: string): string {
  if (!/^[\w-]+$/.test(userId)) throw new Error("Utilisateur invalide");
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    throw new Error("Fichier invalide");
  }
  const full = path.join(UPLOAD_ROOT, "forum", userId, filename);
  const root = path.join(UPLOAD_ROOT, "forum");
  if (!full.startsWith(root)) throw new Error("Chemin invalide");
  return full;
}

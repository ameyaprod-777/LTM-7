import { mkdir, writeFile, unlink, rm } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  validateFileMagic,
  type AllowedDocMime,
} from "@/lib/file-magic";

/** Racine des uploads. En prod : volume Docker dédié (ex. /data/uploads). */
const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT?.trim() ||
  path.join(process.cwd(), "uploads");

const ALLOWED_MIME: Record<AllowedDocMime, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const KYC_ALLOWED: AllowedDocMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const KYC_MAX_BYTES = 5 * 1024 * 1024;

export function validateKycFile(file: File): string | null {
  if (!(file.type in ALLOWED_MIME)) {
    return "Format non accepté. Utilisez JPG, PNG, WebP ou PDF.";
  }
  if (file.size > KYC_MAX_BYTES) {
    return "Fichier trop volumineux (max. 5 Mo).";
  }
  if (file.size === 0) {
    return "Fichier vide.";
  }
  return null;
}

export async function saveKycFile(
  userId: string,
  file: File
): Promise<{
  storagePath: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}> {
  const err = validateKycFile(file);
  if (err) throw new Error(err);

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicErr = validateFileMagic(
    buffer,
    file.type,
    KYC_ALLOWED
  );
  if (magicErr) throw new Error(magicErr);

  const ext = ALLOWED_MIME[file.type as AllowedDocMime];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("kyc", userId);
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, filename);
  await writeFile(absolutePath, buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    mimeType: file.type,
    originalName: file.name.slice(0, 200),
    sizeBytes: file.size,
  };
}

export function getKycAbsolutePath(storagePath: string): string {
  const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(UPLOAD_ROOT, normalized);
  if (!full.startsWith(UPLOAD_ROOT)) {
    throw new Error("Chemin invalide");
  }
  return full;
}

export async function deleteKycStorage(storagePath: string) {
  try {
    await unlink(getKycAbsolutePath(storagePath));
  } catch {
    /* fichier déjà absent */
  }
}

export async function deleteUserKycFolder(userId: string) {
  try {
    await rm(path.join(UPLOAD_ROOT, "kyc", userId), { recursive: true, force: true });
  } catch {
    /* dossier absent */
  }
}

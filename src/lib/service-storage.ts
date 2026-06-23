import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const SERVICE_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

export function validateServicePhotoFile(file: File): string | null {
  if (!ALLOWED_MIME[file.type]) {
    return "Format non accepté. Utilisez JPG, PNG ou WebP.";
  }
  if (file.size > SERVICE_PHOTO_MAX_BYTES) {
    return "Image trop volumineuse (max. 8 Mo).";
  }
  if (file.size === 0) {
    return "Fichier vide.";
  }
  return null;
}

export async function saveServicePhotoFile(serviceId: string, file: File) {
  const err = validateServicePhotoFile(file);
  if (err) throw new Error(err);

  const ext = ALLOWED_MIME[file.type];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("services", serviceId);
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
}

export function getServicePhotoAbsolutePath(storagePath: string): string {
  const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(UPLOAD_ROOT, normalized);
  if (!full.startsWith(UPLOAD_ROOT)) {
    throw new Error("Chemin invalide");
  }
  return full;
}

export function servicePhotoPublicUrl(serviceId: string, filename: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/services/photos/${serviceId}/${filename}`;
}

export async function savePendingServicePhoto(userId: string, file: File) {
  const err = validateServicePhotoFile(file);
  if (err) throw new Error(err);

  const ext = ALLOWED_MIME[file.type];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("services", "pending", userId);
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
}

export function getPendingServicePhotoAbsolutePath(
  userId: string,
  filename: string
): string {
  if (!/^[\w-]+$/.test(userId)) throw new Error("Utilisateur invalide");
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    throw new Error("Fichier invalide");
  }
  const full = path.join(UPLOAD_ROOT, "services", "pending", userId, filename);
  const root = path.join(UPLOAD_ROOT, "services", "pending");
  if (!full.startsWith(root)) throw new Error("Chemin invalide");
  return full;
}

export function pendingServicePhotoPublicUrl(userId: string, filename: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/services/photos/pending/${userId}/${filename}`;
}

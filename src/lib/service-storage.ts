import { mkdir, writeFile, rename, copyFile, unlink } from "fs/promises";
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

export const SERVICE_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

function uploadRoot() {
  return getUploadRoot();
}

export function validateServicePhotoFile(file: File): string | null {
  const type = (file.type || "").toLowerCase();
  if (type && !ACCEPTABLE_TYPES.has(type) && !type.startsWith("image/")) {
    return "Format non accepté. Utilisez une photo (JPG, PNG, WebP ou HEIC iPhone).";
  }
  if (file.size > SERVICE_PHOTO_MAX_BYTES) {
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
  const err = validateServicePhotoFile(file);
  if (err) throw new Error(err);

  const raw = Buffer.from(await file.arrayBuffer());
  const { buffer, ext } = await normalizeUploadImage(raw);
  const filename = `${randomUUID()}${ext}`;
  const absoluteDir = path.join(uploadRoot(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
}

export async function saveServicePhotoFile(serviceId: string, file: File) {
  return writeNormalizedPhoto(path.join("services", serviceId), file);
}

export function getServicePhotoAbsolutePath(storagePath: string): string {
  const root = uploadRoot();
  const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) {
    throw new Error("Chemin invalide");
  }
  return full;
}

export function servicePhotoPublicUrl(serviceId: string, filename: string) {
  return `/api/services/photos/${serviceId}/${filename}`;
}

export async function savePendingServicePhoto(userId: string, file: File) {
  return writeNormalizedPhoto(path.join("services", "pending", userId), file);
}

export function getPendingServicePhotoAbsolutePath(
  userId: string,
  filename: string
): string {
  if (!/^[\w-]+$/.test(userId)) throw new Error("Utilisateur invalide");
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(filename)) {
    throw new Error("Fichier invalide");
  }
  const root = uploadRoot();
  const full = path.join(root, "services", "pending", userId, filename);
  const pendingRoot = path.join(root, "services", "pending");
  if (!full.startsWith(pendingRoot)) throw new Error("Chemin invalide");
  return full;
}

export function pendingServicePhotoPublicUrl(userId: string, filename: string) {
  return `/api/services/photos/pending/${userId}/${filename}`;
}

export function parseServicePhotoUrl(url: string) {
  const pathOnly = url.includes("/api/")
    ? url.slice(url.indexOf("/api/"))
    : url;
  const pending = pathOnly.match(
    /\/api\/services\/photos\/pending\/([^/]+)\/([^/?#]+)$/
  );
  if (pending) {
    return {
      kind: "pending" as const,
      userId: pending[1]!,
      filename: pending[2]!,
    };
  }
  const match = pathOnly.match(
    /\/api\/services\/photos\/([^/]+)\/([^/?#]+)$/
  );
  if (!match || match[1] === "pending") return null;
  return {
    kind: "service" as const,
    serviceId: match[1]!,
    filename: match[2]!,
  };
}

export async function finalizeServicePhotoUrl(
  serviceId: string,
  ownerId: string,
  rawUrl: string
): Promise<string> {
  const parsed = parseServicePhotoUrl(rawUrl);
  if (!parsed) {
    if (rawUrl.startsWith("/")) return rawUrl;
    try {
      const u = new URL(rawUrl);
      if (u.pathname.startsWith("/api/")) return u.pathname;
    } catch {
      /* ignore */
    }
    return rawUrl;
  }
  if (parsed.kind === "service") {
    return servicePhotoPublicUrl(parsed.serviceId, parsed.filename);
  }
  if (parsed.userId !== ownerId) {
    throw new Error("Photo pending non autorisée");
  }

  const from = getPendingServicePhotoAbsolutePath(
    parsed.userId,
    parsed.filename
  );
  const destDir = path.join(uploadRoot(), "services", serviceId);
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
  return servicePhotoPublicUrl(serviceId, parsed.filename);
}

export async function finalizeServicePhotoUrls(
  serviceId: string,
  ownerId: string,
  urls: string[]
): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls) {
    out.push(await finalizeServicePhotoUrl(serviceId, ownerId, url));
  }
  return out;
}

import { mkdir, writeFile, rename, copyFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getUploadRoot } from "@/lib/upload-root";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const SERVICE_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

function uploadRoot() {
  return getUploadRoot();
}

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
  const absoluteDir = path.join(uploadRoot(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    storagePath: path.join(relativeDir, filename),
    filename,
  };
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
  const err = validateServicePhotoFile(file);
  if (err) throw new Error(err);

  const ext = ALLOWED_MIME[file.type];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("services", "pending", userId);
  const absoluteDir = path.join(uploadRoot(), relativeDir);
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

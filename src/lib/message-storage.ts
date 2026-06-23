import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  validateFileMagic,
  type AllowedDocMime,
} from "@/lib/file-magic";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const ALLOWED_MIME: Record<AllowedDocMime, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const MESSAGE_ALLOWED: AllowedDocMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MESSAGE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export function validateMessageAttachment(file: File): string | null {
  if (!(file.type in ALLOWED_MIME)) {
    return "Format non accepté (JPG, PNG, WebP ou PDF).";
  }
  if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
    return "Fichier trop volumineux (max. 10 Mo).";
  }
  if (file.size === 0) {
    return "Fichier vide.";
  }
  return null;
}

export async function saveMessageAttachment(
  conversationId: string,
  file: File
) {
  const err = validateMessageAttachment(file);
  if (err) throw new Error(err);

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicErr = validateFileMagic(buffer, file.type, MESSAGE_ALLOWED);
  if (magicErr) throw new Error(magicErr);

  const ext = ALLOWED_MIME[file.type as AllowedDocMime];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("messages", conversationId);
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), buffer);

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  return {
    url: `${base.replace(/\/$/, "")}/api/messages/attachments/${conversationId}/${filename}`,
    name: file.name,
    mime: file.type,
  };
}

export function getMessageAttachmentPath(
  conversationId: string,
  filename: string
): string {
  if (!/^[\w-]+$/.test(conversationId)) {
    throw new Error("Conversation invalide");
  }
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp|pdf)$/i.test(filename)) {
    throw new Error("Fichier invalide");
  }
  const full = path.join(UPLOAD_ROOT, "messages", conversationId, filename);
  const root = path.join(UPLOAD_ROOT, "messages");
  if (!full.startsWith(root)) throw new Error("Chemin invalide");
  return full;
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  validateMessageAttachment,
} from "@/lib/message-storage";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveTicketAttachment(ticketId: string, file: File) {
  const err = validateMessageAttachment(file);
  if (err) throw new Error(err);

  const extMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };
  const ext = extMap[file.type];
  const filename = `${randomUUID()}${ext}`;
  const relativeDir = path.join("tickets", ticketId);
  const absoluteDir = path.join(UPLOAD_ROOT, relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { validateFileMagic } = await import("@/lib/file-magic");
  const magicErr = validateFileMagic(buffer, file.type, [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);
  if (magicErr) throw new Error(magicErr);

  await writeFile(path.join(absoluteDir, filename), buffer);

  return {
    url: `/api/support/attachments/${ticketId}/${filename}`,
    name: file.name,
    mime: file.type,
  };
}

export function getTicketAttachmentPath(
  ticketId: string,
  filename: string
): string {
  if (!/^[\w-]+$/.test(ticketId)) {
    throw new Error("Ticket invalide");
  }
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp|pdf)$/i.test(filename)) {
    throw new Error("Fichier invalide");
  }
  const full = path.join(UPLOAD_ROOT, "tickets", ticketId, filename);
  const root = path.join(UPLOAD_ROOT, "tickets");
  if (!full.startsWith(root)) throw new Error("Chemin invalide");
  return full;
}

export { MESSAGE_ATTACHMENT_MAX_BYTES as TICKET_ATTACHMENT_MAX_BYTES };

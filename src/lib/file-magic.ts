export type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp";
export type AllowedDocMime = AllowedImageMime | "application/pdf";

const SIGNATURES: { mime: AllowedDocMime; test: (b: Buffer) => boolean }[] = [
  {
    mime: "image/jpeg",
    test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    test: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47,
  },
  {
    mime: "image/webp",
    test: (b) =>
      b.length >= 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
  {
    mime: "application/pdf",
    test: (b) => b.length >= 5 && b.toString("ascii", 0, 5) === "%PDF-",
  },
];

export function detectBufferMime(buffer: Buffer): AllowedDocMime | null {
  for (const { mime, test } of SIGNATURES) {
    if (test(buffer)) return mime;
  }
  return null;
}

/** Vérifie que le contenu est une image autorisée (magic bytes). */
export function validateFileMagic(
  buffer: Buffer,
  declaredMime: string,
  allowed: AllowedDocMime[]
): string | null {
  const detected = detectBufferMime(buffer);
  if (!detected) {
    return "Fichier non reconnu ou format invalide.";
  }
  if (!allowed.includes(detected)) {
    return "Type de fichier non autorisé.";
  }
  // Mobile : file.type souvent vide ou image/heic alors que le contenu est JPEG
  if (
    declaredMime &&
    declaredMime !== detected &&
    declaredMime !== "application/octet-stream" &&
    !declaredMime.startsWith("image/")
  ) {
    return "Le contenu du fichier ne correspond pas à son type déclaré.";
  }
  return null;
}

/** Mime détecté pour choisir l'extension d'enregistrement. */
export function resolveImageMime(
  buffer: Buffer,
  declaredMime: string
): AllowedImageMime | null {
  const detected = detectBufferMime(buffer);
  if (detected === "image/jpeg" || detected === "image/png" || detected === "image/webp") {
    return detected;
  }
  if (
    declaredMime === "image/jpeg" ||
    declaredMime === "image/png" ||
    declaredMime === "image/webp"
  ) {
    return declaredMime;
  }
  return null;
}

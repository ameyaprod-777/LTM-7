import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Chiffrement IBAN (AES-256-GCM).
 * Clé : IBAN_ENCRYPTION_KEY (32+ chars) ou dérivée de NEXTAUTH_SECRET.
 */

function getKey(): Buffer {
  const raw =
    process.env.IBAN_ENCRYPTION_KEY?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!raw || raw.length < 16) {
    throw new Error(
      "IBAN_ENCRYPTION_KEY ou NEXTAUTH_SECRET (16+ caractères) requis pour stocker un IBAN."
    );
  }
  return createHash("sha256").update(raw).digest();
}

/** Normalise : majuscules, sans espaces. */
export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Validation IBAN (longueur + mod 97). */
export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  if (iban.length < 15 || iban.length > 34) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const expanded = rearranged
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 65 && code <= 90 ? String(code - 55) : ch;
    })
    .join("");

  // mod 97 sur grand nombre
  let remainder = 0;
  for (const digit of expanded) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function ibanLast4(raw: string): string {
  const iban = normalizeIban(raw);
  return iban.slice(-4);
}

export function maskIban(last4: string | null | undefined, countryHint = "FR"): string {
  if (!last4) return "—";
  return `${countryHint}** **** **** **** ${last4}`;
}

/** Format stocké : iv:tag:ciphertext (hex). */
export function encryptIban(plainIban: string): string {
  const iban = normalizeIban(plainIban);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(iban, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptIban(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Payload IBAN invalide");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function formatIbanGrouped(iban: string): string {
  const n = normalizeIban(iban);
  return n.replace(/(.{4})/g, "$1 ").trim();
}

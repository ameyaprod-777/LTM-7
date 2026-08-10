import convert from "heic-convert";
import sharp from "sharp";

const MAX_EDGE = 4096;
const JPEG_QUALITY = 85;

/** HEIC/HEIF (iPhone) : box ftyp avec marqueur heic/heif/mif1/msf1… */
export function isHeicBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buffer.toString("ascii", 8, 12).toLowerCase();
  const heicBrands = [
    "heic",
    "heif",
    "mif1",
    "msf1",
    "heix",
    "hevc",
    "hevx",
  ];
  if (heicBrands.includes(brand)) return true;
  const more = buffer
    .toString("ascii", 8, Math.min(buffer.length, 32))
    .toLowerCase();
  return heicBrands.some((b) => more.includes(b));
}

export function isBrowserImageMagic(buffer: Buffer): boolean {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return true;
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true;
  }
  return false;
}

async function heicToJpegBuffer(buffer: Buffer): Promise<Buffer> {
  const out = await convert({
    buffer: new Uint8Array(buffer),
    format: "JPEG",
    quality: 0.9,
  });
  return Buffer.from(out);
}

async function toJpegViaSharp(input: Buffer, maxEdge: number, quality: number) {
  return sharp(input, { failOn: "none", unlimited: true })
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

/**
 * Normalise toute photo uploadée (HEIC iPhone inclus) en JPEG navigateur :
 * orientation EXIF, redimensionnement, qualité stable.
 */
export async function normalizeUploadImage(
  buffer: Buffer,
  opts?: { maxEdge?: number; quality?: number }
): Promise<{ buffer: Buffer; mime: "image/jpeg"; ext: ".jpg" }> {
  const maxEdge = opts?.maxEdge ?? MAX_EDGE;
  const quality = opts?.quality ?? JPEG_QUALITY;

  const attempts: Buffer[] = [buffer];

  if (isHeicBuffer(buffer) || !isBrowserImageMagic(buffer)) {
    // 1) sharp (si libvips HEIF dispo) 2) heic-convert (wasm)
    try {
      const viaSharp = await toJpegViaSharp(buffer, maxEdge, quality);
      return { buffer: viaSharp, mime: "image/jpeg", ext: ".jpg" };
    } catch {
      /* fall through */
    }
    try {
      attempts.unshift(await heicToJpegBuffer(buffer));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "conversion impossible";
      if (!isBrowserImageMagic(buffer)) {
        throw new Error(
          `Image non lisible (${msg}). Réessayez en JPG depuis l’iPhone.`
        );
      }
    }
  }

  let lastError: unknown;
  for (const input of attempts) {
    try {
      const jpeg = await toJpegViaSharp(input, maxEdge, quality);
      return { buffer: jpeg, mime: "image/jpeg", ext: ".jpg" };
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(
    `Image non supportée (${lastError instanceof Error ? lastError.message : "décodage"}). Exportez en JPG depuis l’iPhone.`
  );
}

/**
 * Pour la lecture : si le fichier n’est pas un JPEG/PNG/WebP valide,
 * convertit en JPEG (répare les HEIC déjà stockés avec une mauvaise extension).
 */
export async function ensureBrowserImageBuffer(
  buffer: Buffer
): Promise<{ buffer: Buffer; contentType: string; converted: boolean }> {
  if (isBrowserImageMagic(buffer) && !isHeicBuffer(buffer)) {
    if (buffer[0] === 0xff) {
      return { buffer, contentType: "image/jpeg", converted: false };
    }
    if (buffer[0] === 0x89) {
      return { buffer, contentType: "image/png", converted: false };
    }
    return { buffer, contentType: "image/webp", converted: false };
  }

  const normalized = await normalizeUploadImage(buffer);
  return {
    buffer: normalized.buffer,
    contentType: "image/jpeg",
    converted: true,
  };
}

/**
 * Diagnostique les photos d’annonces en prod (URLs DB vs fichiers disque vs codec).
 *
 * Usage :
 *   npm run media:diagnose
 *   npm run media:diagnose -- <listingId>
 */

import { readFile, access } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { getUploadRoot } from "../src/lib/upload-root";
import {
  ensureBrowserImageBuffer,
  isHeicBuffer,
} from "../src/lib/normalize-image";

const prisma = new PrismaClient();

function magicLabel(buf: Buffer): string {
  if (buf.length < 12) return `trop court (${buf.length} o)`;
  if (isHeicBuffer(buf)) {
    return `HEIC/HEIF (ftyp ${buf.toString("ascii", 8, 12)})`;
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "JPEG";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "PNG";
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "WebP";
  }
  return `inconnu [${Array.from(buf.subarray(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ")}]`;
}

function urlToDiskPath(url: string, root: string): string | null {
  try {
    const pathOnly = url.includes("/api/")
      ? url.slice(url.indexOf("/api/"))
      : url;
    const pending = pathOnly.match(
      /^\/api\/listings\/photos\/pending\/([^/]+)\/([^/?#]+)$/
    );
    if (pending) {
      return path.join(root, "listings", "pending", pending[1]!, pending[2]!);
    }
    const listing = pathOnly.match(
      /^\/api\/listings\/photos\/([^/]+)\/([^/?#]+)$/
    );
    if (listing && listing[1] !== "pending") {
      return path.join(root, "listings", listing[1]!, listing[2]!);
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function main() {
  const listingId = process.argv[2];
  const root = getUploadRoot();

  console.log("UPLOAD_ROOT:", root);
  console.log("cwd:", process.cwd());
  console.log("");

  const photos = await prisma.listingPhoto.findMany({
    where: listingId ? { listingId } : undefined,
    orderBy: { createdAt: "desc" },
    take: listingId ? 50 : 30,
    include: {
      listing: { select: { id: true, title: true, status: true } },
    },
  });

  if (photos.length === 0) {
    console.log("Aucune photo en base.");
    return;
  }

  let missing = 0;
  let heic = 0;
  let convertFail = 0;
  let ok = 0;

  for (const photo of photos) {
    console.log("—".repeat(60));
    console.log(
      `Listing: ${photo.listing.title} (${photo.listingId}) [${photo.listing.status}]`
    );
    console.log(`Photo DB: ${photo.id}`);
    console.log(`URL:      ${photo.url}`);

    const disk = urlToDiskPath(photo.url, root);
    if (!disk) {
      console.log("Disque:   URL non locale (externe ?) — skip codec");
      continue;
    }
    console.log(`Disque:   ${disk}`);

    try {
      await access(disk);
    } catch {
      missing += 1;
      console.log("Statut:   ❌ FICHIER ABSENT");
      continue;
    }

    const buf = await readFile(disk);
    const label = magicLabel(buf);
    console.log(`Taille:   ${buf.length} octets`);
    console.log(`Codec:    ${label}`);

    if (isHeicBuffer(buf) || !label.startsWith("JPEG") && !label.startsWith("PNG") && !label.startsWith("WebP")) {
      if (isHeicBuffer(buf)) heic += 1;
      try {
        const { converted, contentType, buffer } =
          await ensureBrowserImageBuffer(buf);
        console.log(
          `Convert:  ✓ → ${contentType}, ${buffer.length} o (converted=${converted})`
        );
        ok += 1;
      } catch (e) {
        convertFail += 1;
        console.log(
          "Convert:  ❌",
          e instanceof Error ? e.message : e
        );
      }
    } else {
      ok += 1;
      console.log("Convert:  déjà navigateur-OK");
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(
    `Résumé: ${photos.length} photo(s), ${missing} absente(s), ${heic} HEIC, ${convertFail} conversion échouée, ${ok} OK`
  );
  console.log("\nSi FICHIER ABSENT → l’upload n’a pas été écrit (ou mauvais UPLOAD_ROOT).");
  console.log("Si HEIC + Convert ❌ → heic-convert échoue (réuploader après fix, ou JPG).");
  console.log("Si déjà JPEG mais image cassée dans le navigateur → URL / cache / Nginx.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

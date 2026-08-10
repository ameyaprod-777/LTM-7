/**
 * Convertit les photos déjà stockées (HEIC iPhone, etc.) en JPEG navigateur
 * en réécrivant le fichier sur place (même nom → les URLs DB restent valides).
 *
 * Usage (VPS) :
 *   npm run media:fix-images
 */

import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  ensureBrowserImageBuffer,
  isHeicBuffer,
} from "../src/lib/normalize-image";
import { getUploadRoot } from "../src/lib/upload-root";

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (/\.(jpe?g|png|webp|heic|heif)$/i.test(e.name)) {
      yield full;
    }
  }
}

async function fixFile(filePath: string): Promise<boolean> {
  const raw = await readFile(filePath);
  if (!isHeicBuffer(raw)) {
    // JPEG/PNG/WebP déjà OK — vérifier tout de même qu’on peut les lire
    try {
      const { converted, buffer } = await ensureBrowserImageBuffer(raw);
      if (!converted) return false;
      await writeFile(filePath, buffer);
      return true;
    } catch {
      return false;
    }
  }

  const { buffer } = await ensureBrowserImageBuffer(raw);
  await writeFile(filePath, buffer);
  return true;
}

async function main() {
  const root = getUploadRoot();
  const dirs = [
    path.join(root, "listings"),
    path.join(root, "services"),
    path.join(root, "avatars"),
  ];

  let fixed = 0;
  let scanned = 0;
  let errors = 0;

  console.log("UPLOAD_ROOT:", root);

  for (const dir of dirs) {
    for await (const file of walk(dir)) {
      scanned += 1;
      try {
        const ok = await fixFile(file);
        if (ok) {
          fixed += 1;
          console.log("  ✓", path.relative(root, file));
        }
      } catch (e) {
        errors += 1;
        console.error(
          "  ✗",
          path.relative(root, file),
          e instanceof Error ? e.message : e
        );
      }
    }
  }

  console.log(
    `\nTerminé : ${fixed} convertie(s) / ${scanned} scannée(s), ${errors} erreur(s).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

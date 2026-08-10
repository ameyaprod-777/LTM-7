import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getListingPhotoAbsolutePath } from "@/lib/listing-storage";
import { ensureBrowserImageBuffer } from "@/lib/normalize-image";

export async function GET(
  _req: Request,
  { params }: { params: { listingId: string; filename: string } }
) {
  const { listingId, filename } = params;

  if (
    !/^[\w-]+$/.test(listingId) ||
    !/^[\w.-]+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(filename)
  ) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  try {
    const storagePath = path.join("listings", listingId, filename);
    const absolute = getListingPhotoAbsolutePath(storagePath);
    const raw = await readFile(absolute);
    const { buffer, contentType, converted } =
      await ensureBrowserImageBuffer(raw);

    // Réécrit sur disque si HEIC déguisé en .jpg (répare la prod)
    if (converted) {
      try {
        const jpgPath = absolute.replace(/\.(heic|heif)$/i, ".jpg");
        await writeFile(jpgPath === absolute ? absolute : jpgPath, buffer);
      } catch {
        /* lecture seule ok */
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": converted
          ? "public, max-age=3600"
          : "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getListingPhotoAbsolutePath } from "@/lib/listing-storage";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: { listingId: string; filename: string } }
) {
  const { listingId, filename } = params;

  if (
    !/^[\w-]+$/.test(listingId) ||
    !/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)
  ) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  try {
    const storagePath = path.join("listings", listingId, filename);
    const absolute = getListingPhotoAbsolutePath(storagePath);
    const buffer = await readFile(absolute);
    const ext = path.extname(filename).toLowerCase();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
}

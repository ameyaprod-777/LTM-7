import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { getPendingListingPhotoAbsolutePath } from "@/lib/listing-storage";
import { ensureBrowserImageBuffer } from "@/lib/normalize-image";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string; filename: string } }
) {
  try {
    const absolute = getPendingListingPhotoAbsolutePath(
      params.userId,
      params.filename
    );
    const raw = await readFile(absolute);
    const { buffer, contentType, converted } =
      await ensureBrowserImageBuffer(raw);

    if (converted) {
      try {
        await writeFile(absolute, buffer);
      } catch {
        /* ignore */
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
}

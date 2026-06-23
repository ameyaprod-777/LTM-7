import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getPendingServicePhotoAbsolutePath } from "@/lib/service-storage";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: { userId: string; filename: string } }
) {
  try {
    const absolute = getPendingServicePhotoAbsolutePath(
      params.userId,
      params.filename
    );
    const buffer = await readFile(absolute);
    const ext = path.extname(params.filename).toLowerCase();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
}

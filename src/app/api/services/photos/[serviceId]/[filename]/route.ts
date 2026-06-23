import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getServicePhotoAbsolutePath } from "@/lib/service-storage";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: { serviceId: string; filename: string } }
) {
  const { serviceId, filename } = params;

  if (
    !/^[\w-]+$/.test(serviceId) ||
    !/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)
  ) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  try {
    const storagePath = path.join("services", serviceId, filename);
    const absolute = getServicePhotoAbsolutePath(storagePath);
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

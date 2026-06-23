import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getAvatarAbsolutePath } from "@/lib/avatar-storage";

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
  const { userId, filename } = params;

  if (!/^[\w-]+$/.test(userId) || !/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  try {
    const storagePath = path.join("avatars", userId, filename);
    const absolute = getAvatarAbsolutePath(storagePath);
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

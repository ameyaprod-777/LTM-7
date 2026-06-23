import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getForumCoverAbsolutePath } from "@/lib/forum-cover-storage";

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
    const absolute = getForumCoverAbsolutePath(params.userId, params.filename);
    const buffer = await readFile(absolute);
    const ext = path.extname(params.filename).toLowerCase();

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

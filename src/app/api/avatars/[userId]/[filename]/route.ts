import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { getAvatarAbsolutePath } from "@/lib/avatar-storage";
import { ensureBrowserImageBuffer } from "@/lib/normalize-image";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string; filename: string } }
) {
  const { userId, filename } = params;

  if (
    !/^[\w-]+$/.test(userId) ||
    !/^[\w.-]+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(filename)
  ) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  try {
    const storagePath = path.join("avatars", userId, filename);
    const absolute = getAvatarAbsolutePath(storagePath);
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
        "Cache-Control": converted
          ? "public, max-age=3600"
          : "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
}

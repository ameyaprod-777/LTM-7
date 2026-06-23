import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession, unauthorized } from "@/lib/api-auth";
import {
  saveAvatarFile,
  avatarPublicUrl,
  parseAvatarUrl,
  deleteAvatarFile,
} from "@/lib/avatar-storage";

export async function POST(req: Request) {
  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    const previous = parseAvatarUrl(user?.image);
    if (previous?.userId === session.user.id) {
      await deleteAvatarFile(`avatars/${previous.userId}/${previous.filename}`);
    }

    const { filename } = await saveAvatarFile(session.user.id, file);
    const imageUrl = avatarPublicUrl(session.user.id, filename);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ ok: true, image: imageUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de l'upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

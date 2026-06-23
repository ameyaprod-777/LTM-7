import { NextResponse } from "next/server";
import { requireMemberApi } from "@/lib/api-auth";
import {
  savePendingServicePhoto,
  pendingServicePhotoPublicUrl,
} from "@/lib/service-storage";

/** Upload photo avant création du service (brouillon par membre). */
export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const stored = await savePendingServicePhoto(auth.session.user.id, file);
    const url = pendingServicePhotoPublicUrl(
      auth.session.user.id,
      stored.filename
    );
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

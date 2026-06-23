import { NextResponse } from "next/server";
import { requireMemberApi } from "@/lib/api-auth";
import { saveForumCoverFile } from "@/lib/forum-cover-storage";

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const stored = await saveForumCoverFile(auth.session.user.id, file);
    return NextResponse.json(stored, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

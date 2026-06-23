import { NextResponse } from "next/server";
import { getApiSession, unauthorized } from "@/lib/api-auth";
import { buildUserDataExport } from "@/lib/user-data-export";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "dataExport");
  if (limited) return limited;

  const session = await getApiSession();
  if (!session?.user) return unauthorized();

  const data = await buildUserDataExport(session.user.id);
  if (!data) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const filename = `louetonmatos-export-${session.user.id}-${Date.now()}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

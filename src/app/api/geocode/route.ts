import { NextResponse } from "next/server";
import { requireMemberApi } from "@/lib/api-auth";
import { geocodeQuery } from "@/lib/geocoding";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "geocode");
  if (limited) return limited;

  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const q = new URL(req.url).searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Requête vide" }, { status: 400 });
  }

  const point = await geocodeQuery(q);
  if (!point) {
    return NextResponse.json({ error: "Lieu introuvable" }, { status: 404 });
  }

  return NextResponse.json(point);
}

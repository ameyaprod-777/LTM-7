import { NextResponse } from "next/server";
import { purgeDueKycDocuments } from "@/lib/kyc-purge";

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await purgeDueKycDocuments();
  return NextResponse.json({ ok: true, ...result });
}

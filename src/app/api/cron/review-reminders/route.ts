import { NextResponse } from "next/server";
import { sendPendingReviewReminders } from "@/lib/review-reminder";

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await sendPendingReviewReminders();
  return NextResponse.json({ ok: true, ...result });
}

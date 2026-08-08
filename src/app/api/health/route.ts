import { NextResponse } from "next/server";
import { runHealthChecks, healthHttpStatus } from "@/lib/health-check";

/**
 * Readiness probe — ping DB + signale Stripe/Resend.
 * UptimeRobot / Docker : 200 si DB OK, 503 sinon.
 */
export async function GET() {
  const report = await runHealthChecks();
  return NextResponse.json(report, { status: healthHttpStatus(report) });
}

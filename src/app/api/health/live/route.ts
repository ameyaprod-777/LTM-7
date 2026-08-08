import { NextResponse } from "next/server";

/**
 * Liveness probe — process Node.js répond (sans toucher la DB).
 * Utile si vous séparez liveness / readiness dans Kubernetes.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

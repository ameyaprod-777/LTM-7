import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { stripeEnabled } from "@/lib/stripe-config";

export type HealthCheckStatus = "ok" | "degraded" | "error";

export type HealthCheckResult = {
  status: HealthCheckStatus;
  latencyMs?: number;
  message?: string;
  configured?: boolean;
};

export type HealthReport = {
  status: HealthCheckStatus;
  timestamp: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  checks: {
    database: HealthCheckResult;
    stripe: HealthCheckResult;
    email: HealthCheckResult;
  };
};

const APP_VERSION = process.env.APP_VERSION?.trim() || "0.1.0";
const bootTime = Date.now();

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Database unreachable",
    };
  }
}

function checkStripe(): HealthCheckResult {
  const configured = stripeEnabled();
  return {
    status: configured ? "ok" : "degraded",
    configured,
    message: configured
      ? undefined
      : "STRIPE_SECRET_KEY absent — paiements désactivés",
  };
}

function checkEmail(): HealthCheckResult {
  const configured = isEmailConfigured();
  return {
    status: configured ? "ok" : "degraded",
    configured,
    message: configured
      ? undefined
      : "RESEND_API_KEY absent — emails désactivés",
  };
}

function aggregateStatus(
  checks: HealthReport["checks"]
): HealthCheckStatus {
  if (checks.database.status === "error") return "error";
  if (
    checks.stripe.status === "degraded" ||
    checks.email.status === "degraded"
  ) {
    return "degraded";
  }
  return "ok";
}

/** Readiness : DB obligatoire ; Stripe/Resend signalés en degraded. */
export async function runHealthChecks(): Promise<HealthReport> {
  const database = await checkDatabase();
  const stripe = checkStripe();
  const email = checkEmail();
  const checks = { database, stripe, email };

  return {
    status: aggregateStatus(checks),
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    environment: process.env.NODE_ENV ?? "development",
    uptimeSeconds: Math.floor((Date.now() - bootTime) / 1000),
    checks,
  };
}

/** HTTP status pour UptimeRobot / Docker : 503 si DB down. */
export function healthHttpStatus(report: HealthReport): number {
  if (report.checks.database.status === "error") return 503;
  return 200;
}

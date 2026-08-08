/** DSN serveur (API routes, SSR). */
export function getServerSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN?.trim() || undefined;
}

/** DSN client (navigateur). */
export function getClientSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
}

export function isSentryEnabled(dsn?: string): boolean {
  return Boolean(dsn?.trim());
}

export function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}

/** Release / version déployée (visible dans Sentry). */
export function getSentryRelease(): string | undefined {
  const release =
    process.env.SENTRY_RELEASE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim();
  return release || undefined;
}

export function getTracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (!raw) return 0.2;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.2;
}

export function getReplaySessionSampleRate(): number {
  const raw = process.env.SENTRY_REPLAY_SESSION_SAMPLE_RATE;
  if (!raw) return 0.05;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.05;
}

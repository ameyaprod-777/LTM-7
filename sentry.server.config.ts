import * as Sentry from "@sentry/nextjs";
import {
  getServerSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getTracesSampleRate,
  isSentryEnabled,
} from "./src/lib/sentry-config";

const dsn = getServerSentryDsn();

if (isSentryEnabled(dsn)) {
  Sentry.init({
    dsn,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    tracesSampleRate: getTracesSampleRate(),
    debug: false,
  });
}

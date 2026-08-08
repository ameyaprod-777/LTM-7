import * as Sentry from "@sentry/nextjs";
import {
  getClientSentryDsn,
  getReplaySessionSampleRate,
  getSentryEnvironment,
  getSentryRelease,
  getTracesSampleRate,
  isSentryEnabled,
} from "./src/lib/sentry-config";

const dsn = getClientSentryDsn();

if (isSentryEnabled(dsn)) {
  Sentry.init({
    dsn,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    tracesSampleRate: getTracesSampleRate(),
    debug: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: getReplaySessionSampleRate(),
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

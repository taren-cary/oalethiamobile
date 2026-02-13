import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Only track errors, no performance monitoring
  tracesSampleRate: 0, // Disable performance tracing
  
  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Only capture errors in production (optional - you can enable for dev too)
  enabled: process.env.NODE_ENV === "production",
  
  // Integrations
  integrations: [
    // Automatically capture console.error calls
    Sentry.consoleLoggingIntegration({
      levels: ["error"], // Only capture errors, not logs/warnings
    }),
  ],
  
  // Ignore common non-critical errors
  ignoreErrors: [
    // Network errors that are handled gracefully
    "NetworkError",
    "Failed to fetch",
  ],
  
  // Release tracking (optional)
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
});


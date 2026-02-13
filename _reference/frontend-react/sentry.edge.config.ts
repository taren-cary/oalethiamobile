import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Only track errors, no performance monitoring
  tracesSampleRate: 0, // Disable performance tracing
  
  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Only capture errors in production (optional - you can enable for dev too)
  enabled: process.env.NODE_ENV === "production",
});


const { withSentryConfig } = require("@sentry/nextjs");
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Set output file tracing root to silence multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname, '../'),
  
  // Sentry webpack plugin options
  sentry: {
    // Suppresses source map uploading logs during build
    hideSourceMaps: true,
    
    // Automatically instrument files
    widenClientFileUpload: true,
    
    // Route browser requests to Sentry
    tunnelRoute: "/monitoring",
    
    // Disables Sentry webpack plugin in development
    disableServerWebpackPlugin: process.env.NODE_ENV !== "production",
    disableClientWebpackPlugin: process.env.NODE_ENV !== "production",
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry options
  org: "oalethia",
  project: "javascript-nextjs",
  
  // Only upload source maps in production
  silent: true,
  
  // Disable source maps upload in development
  widenClientFileUpload: true,
  
  // Hide source maps from client bundles
  hideSourceMaps: true,
});

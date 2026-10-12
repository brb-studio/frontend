import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Stripe.js (card payments) must load from js.stripe.com and runs its fields and 3-D Secure in frames:
// the directives Stripe documents for Stripe.js (docs.stripe.com/security/guide#content-security-policy).
const stripeJs = "https://js.stripe.com https://*.js.stripe.com";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${stripeJs}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.stripe.com",
  "font-src 'self'",
  "connect-src 'self' https://api.stripe.com",
  `frame-src ${stripeJs} https://hooks.stripe.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // The service worker must never be cached, so a new version reaches every phone.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

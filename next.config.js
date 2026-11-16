/** @type {import('next').NextConfig} */
// In production we serve under `/diamondarena` so the app can live at
// businessexcellenceempire.com/diamondarena. Locally we keep `/` for `npm run dev`.
// Override per-environment with NEXT_PUBLIC_BASE_PATH (set to "" to disable).
const explicitBase = process.env.NEXT_PUBLIC_BASE_PATH;
const basePath =
  explicitBase !== undefined
    ? explicitBase
    : process.env.NODE_ENV === "production"
    ? "/diamondarena"
    : "";

const nextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // Expose the resolved basePath to the client bundle so `apiPath()` in
  // src/lib/utils.ts can prefix fetch URLs even when no env var was set.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: { serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"] },
  // Baseline hardening headers. No CSP yet: the app uses inline styles and
  // Google Fonts, so a strict policy needs its own pass with nonces.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;

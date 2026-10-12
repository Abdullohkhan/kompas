import type { NextConfig } from "next";

// The browser only talks to this origin; /api/* is forwarded to the NestJS backend.
// That keeps the httpOnly auth cookie first-party (no CORS, no third-party cookie issues).
// Note: rewrites are resolved at build time, so BACKEND_URL must be set when building.
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;

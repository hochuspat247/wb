import type { NextConfig } from "next";

const ICON_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: []
  },
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [{ key: "Cache-Control", value: ICON_CACHE }]
      },
      {
        source: "/favicon-v2.ico",
        headers: [{ key: "Cache-Control", value: ICON_CACHE }]
      },
      {
        source: "/favicon-v2.svg",
        headers: [{ key: "Cache-Control", value: ICON_CACHE }]
      },
      {
        source: "/favicon-:size-v2.png",
        headers: [{ key: "Cache-Control", value: ICON_CACHE }]
      },
      {
        source: "/icon-:size-v2.png",
        headers: [{ key: "Cache-Control", value: ICON_CACHE }]
      },
      {
        source: "/apple-touch-icon-v2.png",
        headers: [{ key: "Cache-Control", value: ICON_CACHE }]
      },
      {
        source: "/site.webmanifest",
        headers: [{ key: "Cache-Control", value: ICON_CACHE }]
      }
    ];
  }
};

export default nextConfig;

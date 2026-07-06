import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: []
  }
};

export default nextConfig;

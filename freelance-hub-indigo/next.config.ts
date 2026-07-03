import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { turbo: { enabled: false } as any },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;

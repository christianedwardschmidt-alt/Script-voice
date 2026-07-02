import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { turbo: { enabled: false } as any },
};

export default nextConfig;

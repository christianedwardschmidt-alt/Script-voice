import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { turbo: { enabled: false } as any },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['@libsql/client'],
};

export default nextConfig;

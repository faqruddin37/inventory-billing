import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent ESLint warnings/minor formatting issues from blocking production Vercel builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ensures type safety checks pass during build
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

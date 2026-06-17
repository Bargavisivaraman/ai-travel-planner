import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },
  eslint: {
    // Linting runs in CI; do not fail production builds on lint warnings.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

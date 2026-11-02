import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/precisz-shadow-ops",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
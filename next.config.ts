import type { NextConfig } from "next";

const repoName = "/precisz-shadow-ops";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: repoName,
  assetPrefix: `${repoName}/`,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
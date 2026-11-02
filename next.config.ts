import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "/precisz-shadow-ops";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: isProd ? repoName : "",
  assetPrefix: isProd ? repoName : "",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
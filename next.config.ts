import type { NextConfig } from "next";

const assetPrefix = process.env.GITHUB_PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  assetPrefix,
};

export default nextConfig;

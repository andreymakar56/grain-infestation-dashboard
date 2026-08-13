import type { NextConfig } from "next";

const repositoryName = "grain-infestation-dashboard";
const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isProduction ? `/${repositoryName}` : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

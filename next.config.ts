import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: { root: process.cwd() },
};
export default config;

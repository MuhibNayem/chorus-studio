import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    CHORUS_API_URL: process.env.CHORUS_API_URL || "http://localhost:8080",
  },
};

export default nextConfig;

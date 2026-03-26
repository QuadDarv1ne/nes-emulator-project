import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Примечание: Turbopack имеет известную проблему с _global-error
  // Это не влияет на работу приложения в runtime
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ??
  "https://api.stjosephcatholicchurchdompoase.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    // Pin root when multiple lockfiles exist (e.g. ~/package-lock.json vs this repo).
    root: path.resolve(__dirname),
  },
  webpack: (config, { dir }) => {
    const projectRoot = dir ?? path.resolve(process.cwd());
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.resolve(projectRoot, "node_modules", "tailwindcss"),
    };
    return config;
  },
};

export default nextConfig;

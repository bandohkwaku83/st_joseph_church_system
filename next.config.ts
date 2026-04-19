import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
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

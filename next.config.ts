import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Evita que Turbopack use /Users/r/package-lock.json y escanee ~/Downloads
    root: projectRoot,
  },
  experimental: {
    // Middleware/proxy buffers request bodies; uploads can reach 50 MB.
    proxyClientMaxBodySize: '55mb',
  },
};

export default nextConfig;

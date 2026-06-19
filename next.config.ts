import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Evita que Turbopack use /Users/r/package-lock.json y escanee ~/Downloads
    root: projectRoot,
  },
};

export default nextConfig;

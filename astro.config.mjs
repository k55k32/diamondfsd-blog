import os from "node:os";
import path from "node:path";
import { defineConfig } from "astro/config";

const viteCacheDir = path.join(os.tmpdir(), "diamondfsd-blog-vite");

export default defineConfig({
  site: "https://diamondfsd.com",
  output: "static",
  trailingSlash: "always",
  vite: {
    cacheDir: viteCacheDir,
    server: {
      watch: {
        usePolling: true,
        interval: 1000
      }
    }
  }
});

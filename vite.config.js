import { cpSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// Relative base so the site works both on GitHub Pages (/apprentice_demo/)
// and when opening index.html via file:// (double-click).
const BASE = "./";

export default defineConfig({
  base: BASE,
  root: ".",
  plugins: [
    {
      name: "copy-static-assets",
      closeBundle() {
        const distDir = resolve(__dirname, "dist");

        cpSync(resolve(__dirname, "js"), resolve(distDir, "js"), {
          recursive: true,
        });

        // Vite leaves classic <script src="/js/..."> or "js/..." as-is; normalize to ./js/
        const indexPath = resolve(distDir, "index.html");
        if (existsSync(indexPath)) {
          let html = readFileSync(indexPath, "utf8");
          html = html.replace(
            /(<script\b[^>]*\bsrc=["'])\/?(?:\.\/)?js\//g,
            `$1./js/`
          );
          // Normalize any remaining root-absolute asset URLs to relative
          html = html.replace(
            /((?:href|src|data)=["'])\/(assets\/[^"']+)(["'])/g,
            `$1./$2$3`
          );
          writeFileSync(indexPath, html);
        }

        writeFileSync(resolve(distDir, ".nojekyll"), "");
      },
    },
  ],
  server: {
    port: 8146,
    open: true,
  },
  preview: {
    port: 4173,
    open: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
});

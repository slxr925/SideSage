import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "",
  plugins: [
    react(),
    {
      name: "copy-extension-manifest",
      closeBundle() {
        copyFileSync(resolve(__dirname, "manifest.json"), resolve(__dirname, "dist/manifest.json"));
      }
    }
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel/index.html"),
        serviceWorker: resolve(__dirname, "src/background/serviceWorker.ts"),
        selection: resolve(__dirname, "src/content/selection.ts")
      },
      output: {
        manualChunks(id) {
          if (id.includes("shared/i18n/") || id.includes("shared\\i18n\\")) {
            return "messages";
          }
          if (id.includes("shared/messages") || id.includes("shared\\messages")) {
            return "messages";
          }
          if (id.includes("shared/storage") || id.includes("shared\\storage")) {
            return "messages";
          }
          if (id.includes("shared/prompts") || id.includes("shared\\prompts")) {
            return "messages";
          }
        },
        entryFileNames: (chunk) => {
          if (chunk.name === "serviceWorker") {
            return "background/serviceWorker.js";
          }
          if (chunk.name === "selection") {
            return "content/selection.js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});

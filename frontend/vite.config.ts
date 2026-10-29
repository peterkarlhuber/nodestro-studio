/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: false } },
  },
  build: {
    outDir: "../src/nodestro_studio/static",
    emptyOutDir: false,
    // The main chunk carries the interface texts of all six languages (switching needs no reload).
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom", "@tanstack/react-query", "zustand"],
          flow: ["@xyflow/react"],
          codemirror: ["@uiw/react-codemirror", "@codemirror/lang-python", "@codemirror/lang-json", "@codemirror/view"],
          markdown: ["react-markdown", "remark-gfm"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Dates in tests are formatted in a fixed time zone.
    env: { TZ: "UTC" },
  },
});

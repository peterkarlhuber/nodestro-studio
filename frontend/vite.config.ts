/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const REACT = new Set([
  "react",
  "react-dom",
  "scheduler",
  "react-router",
  "react-router-dom",
  "cookie",
  "set-cookie-parser",
  "@tanstack/react-query",
  "@tanstack/query-core",
  "zustand",
  "use-sync-external-store",
]);
const CODEMIRROR = new Set(["crelt", "style-mod", "w3c-keyname"]);
// react-markdown with remark-gfm and the unified/micromark packages only they use.
const MARKDOWN =
  /^(react-markdown|remark-|rehype-|mdast-|micromark|unified$|unist-|hast-|vfile|html-url-attributes$|property-information$|space-separated-tokens$|comma-separated-tokens$|decode-named-character-reference$|character-entities|ccount$|devlop$|bail$|trough$|is-plain-obj$|zwitch$|longest-streak$|markdown-table$|trim-lines$|estree-util-|style-to-|inline-style-parser$)/;

/** The vendor chunk of a module: react (every page), flow (canvas), codemirror, markdown, or none. */
function vendorChunk(id: string): string | undefined {
  const name = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(id)?.[1];
  // Styles stay with the code that imports them (the canvas base styles are part of the main CSS).
  if (!name || id.endsWith(".css")) return undefined;
  if (REACT.has(name)) return "react";
  if (name.startsWith("@xyflow/") || name.startsWith("d3-") || name === "classcat") return "flow";
  if (name.startsWith("@codemirror/") || name.startsWith("@lezer/") || name.startsWith("@uiw/") || CODEMIRROR.has(name))
    return "codemirror";
  if (MARKDOWN.test(name)) return "markdown";
  // Everything else follows its importers.
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: false } },
  },
  build: {
    outDir: "../src/nodestro_studio/static",
    emptyOutDir: false,
    // The main chunk carries the English interface texts; every other language is a chunk of its own
    // (src/i18n/bundles), fetched before its first use.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Named vendor chunks. A function (not the object form) so that packages shared by several
        // libraries land where they belong: use-sync-external-store is used by react-i18next and by
        // the canvas, and in the object form it went into "flow" and pulled the canvas into every page.
        manualChunks: (id) => vendorChunk(id),
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

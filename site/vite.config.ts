import { globSync } from "node:fs"
import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

const root = import.meta.dirname

// Every .html file under site/ is a page of its own, so adding a page needs no change here.
const pages = globSync("**/*.html", { cwd: root, exclude: ["dist/**", "node_modules/**"] }).map((page) => resolve(root, page))

export default defineConfig({
  root,
  // Only the acceptance page loads Tailwind (its CSS starts with @import "tailwindcss"); the plugin leaves every other stylesheet as it is.
  plugins: [tailwindcss()],
  // GitHub Pages serves the demo under a sub-path, which the deploy passes in SITE_BASE (an empty value counts as unset).
  base: process.env["SITE_BASE"] || "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rolldownOptions: { input: pages },
  },
  server: { port: 5173 },
  // Playwright opens http://127.0.0.1:4173. The default host "localhost" can resolve to ::1 alone (it does on Windows),
  // and then nothing answers on 127.0.0.1, so the preview listens on the IPv4 loopback address itself.
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
})

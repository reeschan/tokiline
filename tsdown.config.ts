import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "react/index": "src/react/index.tsx",
  },
  format: "esm",
  dts: true,
  outDir: "dist",
  fixedExtension: false,
  deps: { neverBundle: [/^react(?:\/|$)/] },
  clean: true,
})

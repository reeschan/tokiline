import { resolve } from "node:path"
import { configDefaults, defineConfig } from "vitest/config"

// React 18 has its own install in test/react18, so react-dom 18 loads react 18 there instead of the React 19 at the root.
const react18Modules = resolve(import.meta.dirname, "test/react18/node_modules")

export default defineConfig({
  test: {
    // Inside AI agents Vitest 5 defaults to the minimal reporter, which prints nothing for passing files.
    // Use the default reporter there too, so each file still shows the project (react19 or react18) that ran it.
    reporters: configDefaults.reporters.map((reporter) => (reporter === "minimal" ? "default" : reporter)),
    projects: [
      {
        extends: true,
        test: {
          name: "react19",
          include: ["test/**/*.test.{ts,tsx}"],
          exclude: [...configDefaults.exclude, "test/**/*.react18.test.tsx"],
        },
      },
      {
        extends: true,
        resolve: {
          // The aliases apply to every module Vite transforms in this project: the test files and src/react,
          // including the react/jsx-runtime (or react/jsx-dev-runtime) import that the JSX transform adds.
          // Entries are tried in order, so react-dom comes first and its imports never fall through to react.
          alias: [
            { find: "react-dom", replacement: resolve(react18Modules, "react-dom") },
            { find: "react", replacement: resolve(react18Modules, "react") },
          ],
        },
        test: {
          name: "react18",
          include: ["test/**/*.react18.test.tsx"],
        },
      },
    ],
  },
})

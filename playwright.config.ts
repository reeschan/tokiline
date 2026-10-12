import { defineConfig, devices } from "@playwright/test"

const isCI = Boolean(process.env["CI"])

export default defineConfig({
  testDir: "e2e",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  // Baseline images are Linux ones only, so the file name carries no OS name.
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}",
  // Screenshots are compared only on Linux (CI and the Playwright Docker image). Other OSes run the layout checks only.
  ignoreSnapshots: process.platform !== "linux",
  expect: { toHaveScreenshot: { animations: "disabled" } },
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "pnpm build && pnpm site:build && pnpm site:preview",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
})

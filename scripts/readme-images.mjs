// Takes the images of the README (docs/images/*.png) from the demo site: build, start the Vite preview, shoot, stop.
// Usage: pnpm readme:images
// The images are the Timeline in the light and dark color schemes: hero, theming, hero-horizontal, orientation,
// flow-horizontal, flow and presets (the /showcase/ page, the parts with data-shot) and tailwind (the main of
// /acceptance/portfolio.html). Every run replaces all of the files.
// The preview and the browser are stopped on success and on failure. On failure this script prints the reason and exits with 1.
import { spawn, spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { createServer } from "node:net"
import { join } from "node:path"
import { setTimeout as sleep } from "node:timers/promises"
import { chromium } from "@playwright/test"

const root = join(import.meta.dirname, "..")
const outDir = join(root, "docs/images")
const host = "127.0.0.1"
const port = 4173
const baseUrl = `http://${host}:${port}`
const readyTimeout = 60_000
const requestTimeout = 30_000

// What to shoot. The file is <name>-<light|dark>.png.
const shots = [
  { name: "hero", path: "/showcase/", selector: '[data-shot="hero"]' },
  { name: "theming", path: "/showcase/", selector: '[data-shot="theming"]' },
  { name: "hero-horizontal", path: "/showcase/", selector: '[data-shot="hero-horizontal"]' },
  { name: "orientation", path: "/showcase/", selector: '[data-shot="orientation"]' },
  { name: "flow-horizontal", path: "/showcase/", selector: '[data-shot="flow-horizontal"]' },
  { name: "flow", path: "/showcase/", selector: '[data-shot="flow"]' },
  { name: "presets", path: "/showcase/", selector: '[data-shot="presets"]' },
  { name: "tailwind", path: "/acceptance/portfolio.html", selector: "main", darkClass: true },
]
const colorSchemes = ["light", "dark"]

// Runs `pnpm <args>` in the repository root and returns whether it exited with 0.
// The command goes to the shell as one string: on Windows pnpm is often pnpm.cmd, which Node starts only through
// the shell, and a single string with fixed arguments needs no escaping.
function pnpm(args) {
  const command = `pnpm ${args}`
  console.log(`> ${command}`)
  const result = spawnSync(command, { cwd: root, stdio: "inherit", shell: true })
  if (result.error) console.error(`readme-images: could not run ${command}: ${result.error.message}`)
  return result.status === 0
}

// Returns the path of the CLI file that the vite package declares as its bin.
function viteCli() {
  const packageFile = createRequire(join(root, "package.json")).resolve("vite/package.json")
  const { bin } = JSON.parse(readFileSync(packageFile, "utf8"))
  return join(packageFile, "..", typeof bin === "string" ? bin : bin.vite)
}

// Throws if something already listens on the preview's port: it would answer instead of the preview we start.
function assertPortFree() {
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once("error", () => reject(new Error(`port ${port} on ${host} is already in use. Stop that process first.`)))
    probe.listen(port, host, () => probe.close(() => resolve()))
  })
}

// Starts `vite preview` as a direct child of this process: node runs Vite's CLI file itself, with no shell, pnpm or
// .cmd shim in between, so stopping the child stops the server on every platform. Its output is kept for failure reports.
function startPreview() {
  const child = spawn(process.execPath, [viteCli(), "preview", "--config", "site/vite.config.ts"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  })
  const server = { child, output: "", exited: false }
  const keep = (text) => (server.output += text)
  child.stdout.setEncoding("utf8").on("data", keep)
  child.stderr.setEncoding("utf8").on("data", keep)
  child.once("exit", () => (server.exited = true))
  child.once("error", (error) => {
    keep(`\n${error.message}\n`)
    server.exited = true
  })
  // Last resort if this script ends in another way (an uncaught error, Ctrl+C or a kill).
  process.once("exit", () => server.exited || child.kill("SIGKILL"))
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => process.exit(1))
  return server
}

// Stops the preview and resolves once its process has exited.
function stopPreview(server) {
  if (server.exited) return Promise.resolve()
  return new Promise((resolve) => {
    const forceKill = setTimeout(() => server.child.kill("SIGKILL"), 10_000)
    server.child.once("exit", () => {
      clearTimeout(forceKill)
      resolve()
    })
    server.child.kill()
  })
}

// Resolves once the preview answers, and rejects if it exits or does not answer in time.
async function waitUntilReady(server) {
  const deadline = Date.now() + readyTimeout
  while (!server.exited) {
    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(requestTimeout) })
      await response.body?.cancel()
      return
    } catch {
      if (Date.now() > deadline) throw new Error(`vite preview did not answer within ${readyTimeout / 1000} s`)
      await sleep(200)
    }
  }
  throw new Error(`vite preview exited before it answered\n${server.output.trimEnd()}`)
}

// Shoots one part of one page in one color scheme and returns the file path.
async function shoot(context, { name, path, selector, darkClass }, colorScheme) {
  const page = await context.newPage()
  try {
    await page.emulateMedia({ colorScheme })
    await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" })
    if (darkClass && colorScheme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"))
    await page.evaluate(() => document.fonts.ready)
    const file = join(outDir, `${name}-${colorScheme}.png`)
    await page.locator(selector).screenshot({ path: file, animations: "disabled" })
    return file
  } finally {
    await page.close()
  }
}

// Shoots all the images with Chromium and prints the name and size of each file.
async function shootAll() {
  mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, reducedMotion: "reduce" })
    for (const shot of shots) {
      for (const colorScheme of colorSchemes) {
        const file = await shoot(context, shot, colorScheme)
        console.log(`${file.slice(outDir.length + 1)} ${Math.round(statSync(file).size / 1024)} KB`)
      }
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  if (!pnpm("build") || !pnpm("site:build")) throw new Error("the build failed")
  await assertPortFree()
  const server = startPreview()
  try {
    await waitUntilReady(server)
    await shootAll()
  } finally {
    await stopPreview(server)
  }
}

process.exitCode = await main().then(
  () => 0,
  (error) => {
    console.error(`readme-images: ${error.message}`)
    return 1
  },
)

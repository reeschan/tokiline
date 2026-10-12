// Starts an example in production mode (`next start`) and checks that tokiline renders there.
// Usage: node examples/check.mjs <example>   (for example: node examples/check.mjs next-16)
// Install and build the example first (`pnpm --dir examples/<example> install --ignore-workspace` and `... build`).
//
// The server listens on a free port of 127.0.0.1. Once it answers, this script checks that:
//   1. the HTML of / (App Router) and /pages-router (Pages Router) has class="toki-timeline" and class="toki-item"
//   2. one of the stylesheets each page links with <link rel="stylesheet"> contains toki-timeline
//   3. the RSC payload of / (requested with the RSC: 1 header) contains toki-timeline. The payload carries the elements
//      a Server Component renders, but only a reference for a Client Component, so this shows the Timeline is a Server Component.
// It prints "ok" when every check passes. Otherwise it prints the reasons and the server's output, and exits with 1.
// The server is stopped in both cases.
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:net"
import { join } from "node:path"
import { setTimeout as sleep } from "node:timers/promises"

const host = "127.0.0.1"
const readyTimeout = 60_000
const requestTimeout = 30_000
const pages = ["/", "/pages-router"]

// Returns examples/<name> after making sure Next.js is installed there.
function findExample(name) {
  if (!name) throw new Error("usage: node examples/check.mjs <example>, for example next-16")
  const dir = join(import.meta.dirname, name)
  if (!existsSync(join(dir, "package.json"))) throw new Error(`examples/${name}/package.json does not exist`)
  if (!existsSync(join(dir, "node_modules/next/package.json"))) {
    throw new Error(`Next.js is not installed in examples/${name}. Run: pnpm --dir examples/${name} install --ignore-workspace`)
  }
  return dir
}

// Returns the path of the CLI file that the next package declares as its bin.
function nextCli(exampleDir) {
  const nextDir = join(exampleDir, "node_modules/next")
  const { bin } = JSON.parse(readFileSync(join(nextDir, "package.json"), "utf8"))
  return join(nextDir, typeof bin === "string" ? bin : bin.next)
}

// Resolves to a TCP port on the host that nothing listens on right now.
function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once("error", reject)
    probe.listen(0, host, () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

// Starts `next start` as a direct child of this process: node runs Next.js's CLI file itself, with no shell, pnpm or
// .cmd shim in between, so stopping the child stops the server on every platform. Its output is kept for failure reports.
function startServer(exampleDir, port) {
  const child = spawn(process.execPath, [nextCli(exampleDir), "start", "--hostname", host, "--port", String(port)], {
    cwd: exampleDir,
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

// Stops the server and resolves once its process has exited.
function stopServer(server) {
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

// Resolves once the server answers a request, and rejects if it exits or does not answer in time.
async function waitUntilReady(server, baseUrl) {
  const deadline = Date.now() + readyTimeout
  while (!server.exited) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(requestTimeout) })
      await response.body?.cancel()
      return
    } catch {
      if (Date.now() > deadline) throw new Error(`next start did not answer within ${readyTimeout / 1000} s`)
      await sleep(200)
    }
  }
  throw new Error("next start exited before it answered")
}

// GETs the URL and returns the body as text with the Content-Type. A status other than 2xx is an error.
async function get(url, headers = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(requestTimeout) })
  const text = await response.text()
  if (!response.ok) throw new Error(`GET ${url} answered ${response.status} ${response.statusText}`)
  return { text, contentType: response.headers.get("content-type") ?? "" }
}

// Returns the attributes of an HTML start tag (without its "<name") as a map from lowercase name to value.
function parseAttributes(source) {
  const attributes = new Map()
  for (const [, name, ...values] of source.matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    attributes.set(name.toLowerCase(), values.find((value) => value !== undefined) ?? "")
  }
  return attributes
}

// Returns the absolute URLs of the <link rel="stylesheet"> elements in the HTML.
function findStylesheets(html, pageUrl) {
  const urls = new Set()
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag.slice("<link".length))
    const rel = (attributes.get("rel") ?? "").toLowerCase().split(/\s+/)
    const href = attributes.get("href")
    if (rel.includes("stylesheet") && href) urls.add(new URL(href.replaceAll("&amp;", "&"), pageUrl).href)
  }
  return [...urls]
}

// Checks 1 and 2 for one page.
async function checkPage(baseUrl, path) {
  const pageUrl = new URL(path, baseUrl)
  const { text: html } = await get(pageUrl)
  const problems = ['class="toki-timeline"', 'class="toki-item"']
    .filter((attribute) => !html.includes(attribute))
    .map((attribute) => `${path}: the HTML has no ${attribute}`)

  const stylesheets = findStylesheets(html, pageUrl)
  const styles = await Promise.all(stylesheets.map(async (url) => (await get(url)).text))
  if (!styles.some((css) => css.includes("toki-timeline"))) {
    const linked = stylesheets.length > 0 ? stylesheets.join(", ") : "none"
    problems.push(`${path}: no stylesheet the HTML links contains toki-timeline (linked: ${linked})`)
  }
  return problems
}

// Check 3. Next.js may first redirect an RSC request to a URL with an _rsc search parameter; fetch follows the redirect
// and sends the RSC header again. The Content-Type check makes sure the HTML (which also has the classes) is not read instead.
async function checkServerComponent(baseUrl) {
  const { text, contentType } = await get(new URL("/", baseUrl), { RSC: "1" })
  if (!contentType.startsWith("text/x-component")) {
    return [`/ with RSC: 1 answered ${contentType || "no Content-Type"}, not an RSC payload (text/x-component)`]
  }
  if (!text.includes("toki-timeline")) {
    return ["/ with RSC: 1: the RSC payload has no toki-timeline, so the Timeline was not rendered as a Server Component"]
  }
  return []
}

// Describes an error with its cause (fetch puts the network error there).
function describe(error) {
  return error.cause ? `${error.message}: ${error.cause.message ?? error.cause}` : error.message
}

// Runs every check against the running server and returns the problems found.
async function runChecks(server, baseUrl) {
  try {
    await waitUntilReady(server, baseUrl)
  } catch (error) {
    return [describe(error)]
  }
  const checks = [...pages.map((path) => checkPage(baseUrl, path)), checkServerComponent(baseUrl)]
  const results = await Promise.all(checks.map((check) => check.catch((error) => [describe(error)])))
  return results.flat()
}

async function main(name) {
  const exampleDir = findExample(name)
  const port = await findFreePort()
  const server = startServer(exampleDir, port)
  let problems
  try {
    problems = await runChecks(server, `http://${host}:${port}`)
  } finally {
    await stopServer(server)
  }

  if (problems.length === 0) {
    console.log("ok")
    return 0
  }
  for (const problem of problems) console.error(`check ${name}: ${problem}`)
  console.error(`--- output of next start ---\n${server.output.trimEnd()}`)
  return 1
}

process.exitCode = await main(process.argv[2]).catch((error) => {
  console.error(`check: ${describe(error)}`)
  return 1
})

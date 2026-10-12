// Runs `pnpm test:e2e` inside the official Playwright Linux image, so screenshots match CI.
// Extra arguments (for example --update-snapshots or a test file name) go to `pnpm test:e2e` as they are.
import { spawnSync } from "node:child_process"

const image = "mcr.microsoft.com/playwright:v1.64.0-noble"
const script = 'corepack enable && pnpm install --frozen-lockfile && pnpm test:e2e "$@"'

const args = [
  "run",
  "--rm",
  "--ipc=host",
  "-v",
  `${process.cwd()}:/work`,
  // Keeps the Linux node_modules apart from the host's, whose binaries are for another OS.
  "-v",
  "tokiline-node-modules:/work/node_modules",
  "-w",
  "/work",
  image,
  "bash",
  "-c",
  script,
  "bash",
  ...process.argv.slice(2),
]

const result = spawnSync("docker", args, { stdio: "inherit" })

if (result.error) {
  console.error(`Could not start docker: ${result.error.message}`)
  process.exit(1)
}
process.exit(result.status ?? 1)

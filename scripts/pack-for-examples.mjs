// Builds the package and packs it as `pnpm publish` would, into examples/.pack/tokiline.tgz.
// The examples install this tarball (file:../.pack/tokiline.tgz), so they run what npm users get, not the source tree.
// The file name has no version in it, and every run replaces the tarball.
import { spawnSync } from "node:child_process"
import { mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dirname, "..")
const tarball = "examples/.pack/tokiline.tgz"

// Runs `pnpm <args>` in the repository root and returns whether it exited with 0.
// The command goes to the shell as one string: on Windows pnpm is often pnpm.cmd, which Node starts only through
// the shell, and a single string with fixed arguments needs no escaping.
function pnpm(args) {
  const command = `pnpm ${args}`
  console.log(`> ${command}`)
  const result = spawnSync(command, { cwd: root, stdio: "inherit", shell: true })
  if (result.error) console.error(`pack-for-examples: could not run ${command}: ${result.error.message}`)
  return result.status === 0
}

// Remove the old tarball first, so a failed run never leaves a stale one for the examples to install.
rmSync(join(root, tarball), { force: true })
mkdirSync(join(root, "examples/.pack"), { recursive: true })

if (pnpm("build") && pnpm(`pack --out ${tarball}`)) {
  console.log(`pack-for-examples: wrote ${tarball}`)
} else {
  console.error("pack-for-examples: failed")
  process.exitCode = 1
}

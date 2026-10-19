// Bundles src/css/tokiline.css into dist/style.css and every src/presets/*.css into dist/presets/*.css,
// each with its source map. Node 24 and later run this file as it is by stripping the types, so it uses
// only erasable type syntax and imports only packages and node: modules.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import browserslist from "browserslist"
import { browserslistToTargets, bundle } from "lightningcss"

const root = join(import.meta.dirname, "..")
const outDir = join(root, "dist")
const presetsDir = join(root, "src/presets")
const targets = browserslistToTargets(browserslist("baseline widely available"))

type BuiltCss = { css: string; map: Uint8Array }

/** Bundles one CSS file for the baseline targets, or reports why it cannot be used and returns null. */
function bundleCss(filename: string, projectRoot: string): BuiltCss | null {
  const { code, map, warnings } = bundle({
    filename,
    targets,
    minify: true,
    sourceMap: true,
    // The map lists its sources relative to the directory that holds it, so they resolve from the map
    // and it carries no absolute paths from the machine that built it.
    projectRoot,
  })

  const name = relative(root, filename)
  if (warnings.length > 0) {
    for (const { loc, message } of warnings) console.error(`${relative(root, loc.filename)}:${loc.line}:${loc.column}: ${message}`)
    console.error(`build-css: Lightning CSS returned ${warnings.length} warning(s) for ${name}`)
    return null
  }

  const css = new TextDecoder().decode(code)
  if (/!\s*important/i.test(css)) {
    console.error(`build-css: ${name} contains !important, which tokiline never uses`)
    return null
  }
  if (!map) {
    console.error(`build-css: Lightning CSS returned no source map for ${name}`)
    return null
  }
  return { css, map }
}

/** Writes a built file and its source map under dir, both named after the source file. */
function writeCss(dir: string, name: string, { css, map }: BuiltCss): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.css`), `${css}\n/*# sourceMappingURL=${name}.css.map */\n`)
  writeFileSync(join(dir, `${name}.css.map`), map)
}

/** Builds the one stylesheet that users import as tokiline/style.css. */
function buildStyle(): boolean {
  const built = bundleCss(join(root, "src/css/tokiline.css"), outDir)
  if (!built) return false
  writeCss(outDir, "style", built)
  console.log("build-css: wrote dist/style.css and dist/style.css.map")
  return true
}

/** Builds each preset into dist/presets/, or does nothing when src/presets/ has no CSS file. */
function buildPresets(): boolean {
  const names = existsSync(presetsDir)
    ? readdirSync(presetsDir)
        .filter((name) => name.endsWith(".css"))
        .sort()
    : []
  const outPresetsDir = join(outDir, "presets")
  for (const name of names) {
    const built = bundleCss(join(presetsDir, name), outPresetsDir)
    if (!built) return false
    writeCss(outPresetsDir, name.slice(0, -".css".length), built)
    console.log(`build-css: wrote dist/presets/${name} and dist/presets/${name}.map`)
  }
  return true
}

process.exitCode = buildStyle() && buildPresets() ? 0 : 1

// Bundles src/css/tokiline.css with Lightning CSS into dist/style.css and dist/style.css.map.
// Node 24 and later run this file as it is by stripping the types, so it uses only erasable type syntax
// and imports only packages and node: modules.
import { mkdirSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import browserslist from "browserslist"
import { browserslistToTargets, bundle } from "lightningcss"

const root = join(import.meta.dirname, "..")
const outDir = join(root, "dist")

function buildCss(): number {
  const { code, map, warnings } = bundle({
    filename: join(root, "src/css/tokiline.css"),
    targets: browserslistToTargets(browserslist("baseline widely available")),
    minify: true,
    sourceMap: true,
    // The map lists its sources relative to dist/ (../src/css/…), so they resolve from the map
    // and it carries no absolute paths from the machine that built it.
    projectRoot: outDir,
  })

  if (warnings.length > 0) {
    for (const { loc, message } of warnings) console.error(`${relative(root, loc.filename)}:${loc.line}:${loc.column}: ${message}`)
    console.error(`build-css: Lightning CSS returned ${warnings.length} warning(s)`)
    return 1
  }

  const css = new TextDecoder().decode(code)
  if (/!\s*important/i.test(css)) {
    console.error("build-css: the output contains !important, which tokiline never uses")
    return 1
  }
  if (!map) {
    console.error("build-css: Lightning CSS returned no source map")
    return 1
  }

  // Write only these two files: dist/ also holds the output of the JS build.
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, "style.css"), `${css}\n/*# sourceMappingURL=style.css.map */\n`)
  writeFileSync(join(outDir, "style.css.map"), map)
  console.log("build-css: wrote dist/style.css and dist/style.css.map")
  return 0
}

process.exitCode = buildCss()

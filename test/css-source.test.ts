import { existsSync, readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// The rules for the CSS sources in src/css and src/presets (AGENTS.md): every rule sits in @layer tokiline, nothing
// uses !important, only logical properties are used, and each preset is a single @layer tokiline.preset block. Each
// check takes CSS text and returns what it found, so the same function runs on the real files and on short examples
// that show it catches violations. Every check removes comments first.

const entry = "tokiline.css"
const cssDir = new URL("../src/css/", import.meta.url)
const presetsDir = new URL("../src/presets/", import.meta.url)

/** Reads every .css file in dir, keyed by file name. A directory that does not exist reads as none. */
function readCssDir(dir: URL): Record<string, string> {
  if (!existsSync(dir)) return {}
  const names = readdirSync(dir)
    .filter((name) => name.endsWith(".css"))
    .sort()
  return Object.fromEntries(names.map((name) => [name, readFileSync(new URL(name, dir), "utf8")]))
}

/** Replaces each comment with a space, so nothing inside a comment counts. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, " ")
}

/** The @import rules in order: the imported file (without a leading "./") and whether it goes into layer(tokiline). */
function parseImports(css: string): { file: string; layered: boolean }[] {
  const imports = stripComments(css).matchAll(/@import\s+(?:url\(\s*)?(["']?)([^"')\s]+)\1\s*\)?([^;]*)(?:;|$)/gi)
  return Array.from(imports, ([, , url = "", conditions = ""]) => ({
    file: url.replace(/^\.\//, ""),
    layered: /^\s*layer\(\s*tokiline\s*\)/.test(conditions),
  }))
}

/** Check 1 for the entry: it imports each of the other files once, always into layer(tokiline), and holds nothing else. */
function findEntryProblems(css: string, others: readonly string[]): string[] {
  const imports = parseImports(css)
  const problems: string[] = []
  for (const other of others) {
    const count = imports.filter(({ file }) => file === other).length
    if (count !== 1) problems.push(`${entry} imports ${other} ${count} times`)
  }
  for (const { file, layered } of imports) {
    if (!others.includes(file)) problems.push(`${entry} imports ${file}, which is not another file in src/css`)
    if (!layered) problems.push(`${entry} imports ${file} without layer(tokiline)`)
  }
  // Anything besides the imports would sit outside @layer tokiline.
  const rest = stripComments(css).replace(/@import\s[^;]*(?:;|$)/gi, "")
  if (rest.trim() !== "") problems.push(`${entry} has more than @import rules`)
  return problems
}

/** Check 1: the problems with the entry, and each other file that has an @import of its own. */
function findImportProblems(sources: Readonly<Record<string, string>>): string[] {
  const { [entry]: entryCss = "", ...others } = sources
  const nestedImports = Object.entries(others)
    .filter(([, css]) => /@import\b/i.test(stripComments(css)))
    .map(([name]) => `${name} has an @import`)
  return [...findEntryProblems(entryCss, Object.keys(others)), ...nestedImports]
}

/** Check 2: each !important, including the form with spaces after the "!". */
function findImportant(css: string): string[] {
  return stripComments(css).match(/!\s*important/gi) ?? []
}

// The physical properties. Their logical forms: inset-* for left, right, top and bottom; inline-size and block-size (with
// min-/max-) for width and height; *-inline-* and *-block-* for margin, padding and border on one side, and
// border-start-start-radius and so on for the corners; inline-start and inline-end values instead of float and clear.
const physicalProperty =
  /^(?:left|right|top|bottom|(?:min-|max-)?(?:width|height)|(?:margin|padding)-(?:left|right|top|bottom)|border-(?:left|right|top|bottom)(?:-[a-z-]+)?|float|clear)$/

/** The declarations: a name and a colon at the start, or right after "{", "}" or ";". Names are lowercased. */
function parseDeclarations(css: string): { property: string; value: string }[] {
  const declarations = stripComments(css).matchAll(/(?:^|[{};])\s*([-\w]+)\s*:([^;{}]*)/g)
  return Array.from(declarations, ([, property = "", value = ""]) => ({ property: property.toLowerCase(), value: value.trim() }))
}

/** Check 3: each declaration of a physical property, and each text-align with a left or right value. */
function findPhysicalProperties(css: string): string[] {
  return parseDeclarations(css)
    .filter(({ property, value }) => physicalProperty.test(property) || (property === "text-align" && /\b(?:left|right)\b/i.test(value)))
    .map(({ property, value }) => `${property}: ${value}`)
}

/** Check 4: each @container whose condition queries width or height (or their min-/max- forms). */
function findPhysicalContainerQueries(css: string): string[] {
  return Array.from(stripComments(css).matchAll(/@container\b([^{]*)\{/gi), ([, prelude = ""]) => prelude.trim())
    .filter((prelude) => /(?<![-\w])(?:min-|max-)?(?:width|height)(?![-\w])/i.test(prelude))
    .map((prelude) => `@container ${prelude}`)
}

/** The index of the "}" that closes the "{" at start, skipping braces inside strings; -1 if it is not closed. */
function findClosingBrace(css: string, start: number): number {
  let depth = 0
  let quote = ""
  for (let index = start; index < css.length; index += 1) {
    const char = css[index]
    if (quote) {
      if (char === "\\") index += 1
      else if (char === quote) quote = ""
    } else if (char === '"' || char === "'") quote = char
    else if (char === "{") depth += 1
    else if (char === "}") {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

/** Check 5: the whole file is one @layer tokiline.preset block, with nothing before or after it. */
function findPresetLayerProblems(css: string): string[] {
  const text = stripComments(css).trim()
  const open = /^@layer\s+tokiline\.preset\s*\{/i.exec(text)
  if (!open) return ["not a single @layer tokiline.preset block"]
  const close = findClosingBrace(text, open[0].length - 1)
  if (close < 0) return ["the @layer tokiline.preset block is not closed"]
  if (text.slice(close + 1).trim() !== "") return ["content after the @layer tokiline.preset block"]
  return []
}

const sources = readCssDir(cssDir)
const presetSources = readCssDir(presetsDir)

/** Runs a check on every file in a source directory and prefixes each finding with the file name. */
function checkEveryFile(files: Readonly<Record<string, string>>, check: (css: string) => string[]): string[] {
  return Object.entries(files).flatMap(([name, css]) => check(css).map((found) => `${name}: ${found}`))
}

describe("1. the entry imports every other file exactly once into layer(tokiline), and no other file imports", () => {
  const layered = (...files: string[]) => files.map((file) => `@import "./${file}" layer(tokiline);`).join("\n")
  const partials = { "base.css": "", "layout.css": "" }

  it("holds for src/css", () => {
    expect(Object.keys(sources)).toContain(entry)
    expect(findImportProblems(sources)).toEqual([])
  })

  it("accepts an entry that imports each file once into the layer", () => {
    const entryCss = '/* The entry. */\n@import "./base.css" layer(tokiline);\n@import url(layout.css) layer(tokiline);\n'
    expect(findImportProblems({ [entry]: entryCss, ...partials })).toEqual([])
  })

  it.each([
    {
      name: "a repeated import and a missing one",
      files: { [entry]: layered("base.css", "base.css"), ...partials },
      expected: ["tokiline.css imports base.css 2 times", "tokiline.css imports layout.css 0 times"],
    },
    {
      name: "an import that is only in a comment",
      files: { [entry]: `/* ${layered("base.css")} */\n${layered("layout.css")}`, ...partials },
      expected: ["tokiline.css imports base.css 0 times"],
    },
    {
      name: "an import of a file not in src/css",
      files: { [entry]: layered("base.css", "layout.css", "extra.css"), ...partials },
      expected: ["tokiline.css imports extra.css, which is not another file in src/css"],
    },
    {
      name: "imports without layer(tokiline)",
      files: { [entry]: '@import "./base.css";\n@import "./layout.css" layer(other);', ...partials },
      expected: ["tokiline.css imports base.css without layer(tokiline)", "tokiline.css imports layout.css without layer(tokiline)"],
    },
    {
      name: "a rule in the entry, outside the layer",
      files: { [entry]: `${layered("base.css", "layout.css")}\n.toki-timeline { margin: 0 }`, ...partials },
      expected: ["tokiline.css has more than @import rules"],
    },
    {
      name: "an @import in another file",
      files: { [entry]: layered("base.css", "layout.css"), "base.css": layered("layout.css"), "layout.css": "" },
      expected: ["base.css has an @import"],
    },
  ])("catches $name", ({ files, expected }) => {
    expect(findImportProblems(files)).toEqual(expected)
  })
})

describe("2. no file uses !important", () => {
  it("holds for src/css", () => {
    expect(checkEveryFile(sources, findImportant)).toEqual([])
  })

  it("holds for src/presets", () => {
    expect(checkEveryFile(presetSources, findImportant)).toEqual([])
  })

  it("catches !important, with or without spaces and in any case", () => {
    expect(findImportant(".a { color: red !important }\n.b { color: red ! IMPORTANT; }")).toEqual(["!important", "! IMPORTANT"])
  })

  it("ignores comments", () => {
    expect(findImportant("/* never !important */\n.a { color: red }")).toEqual([])
  })
})

describe("3. no file declares a physical property", () => {
  const physicalProperties = `
    left right top bottom width height min-width max-width min-height max-height
    margin-left margin-right margin-top margin-bottom padding-left padding-right padding-top padding-bottom
    border-left border-right border-top border-bottom border-left-width border-right-style border-top-color border-bottom-color
    border-top-left-radius border-top-right-radius border-bottom-left-radius border-bottom-right-radius float clear
  `
    .trim()
    .split(/\s+/)

  it("holds for src/css", () => {
    expect(checkEveryFile(sources, findPhysicalProperties)).toEqual([])
  })

  it("holds for src/presets", () => {
    expect(checkEveryFile(presetSources, findPhysicalProperties)).toEqual([])
  })

  it("catches every physical property", () => {
    const css = physicalProperties.map((property) => `.a { ${property}: 0 }`).join("\n")
    expect(findPhysicalProperties(css)).toEqual(physicalProperties.map((property) => `${property}: 0`))
  })

  it("catches a physical property in any case, at the start, and after a nested rule", () => {
    expect(findPhysicalProperties("Top: 0")).toEqual(["top: 0"])
    expect(findPhysicalProperties(".a {\n  &:hover { color: red }\n  Margin-Left: 1rem;\n}")).toEqual(["margin-left: 1rem"])
  })

  it("catches text-align with left or right, and accepts start, end and center", () => {
    const css = ".a { text-align: left } .b { text-align: right } .c { text-align: start } .d { text-align: end } .e { text-align: center }"
    expect(findPhysicalProperties(css)).toEqual(["text-align: left", "text-align: right"])
  })

  it("accepts logical properties, shorthands, custom properties and translate", () => {
    const css = `.toki-item:has(> .toki-meta) {
      inset-inline-start: 0; inset-block: 0; inline-size: 50%; block-size: 50%; min-inline-size: 0; max-block-size: none;
      margin: 0; margin-block-start: 0.5rem; padding: 0; padding-inline-end: 1rem; border-inline-start: 2px solid;
      border-block-end-width: 0; border-start-start-radius: 0; border-width: 0; border-radius: 50%; line-height: 1;
      translate: 2rem 0; text-align: end; --toki-line-width: 2px; --_toki-arrow-border-start: 0;
    }`
    expect(findPhysicalProperties(css)).toEqual([])
  })

  it("ignores comments", () => {
    expect(findPhysicalProperties("/* left: 0; width: 1px; text-align: left */\n.a { inset-inline-start: 0 }")).toEqual([])
  })
})

describe("4. no @container condition uses width or height", () => {
  it("holds for src/css", () => {
    expect(checkEveryFile(sources, findPhysicalContainerQueries)).toEqual([])
  })

  it("catches width and height, with or without min- and max-", () => {
    const css =
      "@container (width > 30rem) {}\n@container toki (min-width: 30rem) {}\n@container (30rem < height) {}\n@container toki (max-height: 10rem) {}"
    expect(findPhysicalContainerQueries(css)).toEqual([
      "@container (width > 30rem)",
      "@container toki (min-width: 30rem)",
      "@container (30rem < height)",
      "@container toki (max-height: 10rem)",
    ])
  })

  it("accepts inline-size, block-size and container names that contain width", () => {
    const css =
      "@container toki (inline-size >= 48rem) {}\n@container (min-block-size: 10rem) {}\n@container toki-width (inline-size > 0) {}"
    expect(findPhysicalContainerQueries(css)).toEqual([])
  })

  it("ignores comments", () => {
    expect(findPhysicalContainerQueries("/* @container (width > 1px) {} */\n@container toki (inline-size > 1px) {}")).toEqual([])
  })
})

describe("5. each preset is one @layer tokiline.preset block", () => {
  it("holds for src/presets", () => {
    expect(checkEveryFile(presetSources, findPresetLayerProblems)).toEqual([])
  })

  it("accepts one layer block with comments, nested rules and braces in strings", () => {
    const css = `/* a preset */
      @layer tokiline.preset {
        .toki-timeline[data-preset="quiet"] { --toki-accent: oklch(60% 0.18 250); }
        @media (prefers-reduced-motion: no-preference) {
          .toki-item { animation: fade 1s }
        }
        .toki-timeline[data-preset="quiet"] .toki-card::before { content: "}" }
      }`
    expect(findPresetLayerProblems(css)).toEqual([])
  })

  it.each([
    {
      name: "an empty file",
      css: "/* only a comment */",
      expected: ["not a single @layer tokiline.preset block"],
    },
    {
      name: "a rule after the layer",
      css: "@layer tokiline.preset { .a { color: red } }\n.b { color: blue }",
      expected: ["content after the @layer tokiline.preset block"],
    },
    {
      name: "a rule before the layer",
      css: ".a { color: red }\n@layer tokiline.preset { .b { color: blue } }",
      expected: ["not a single @layer tokiline.preset block"],
    },
    {
      name: "another layer name",
      css: "@layer tokiline { .a { color: red } }",
      expected: ["not a single @layer tokiline.preset block"],
    },
    {
      name: "an unclosed block",
      css: "@layer tokiline.preset { .a { color: red }",
      expected: ["the @layer tokiline.preset block is not closed"],
    },
    {
      name: "two layer blocks",
      css: "@layer tokiline.preset { .a { color: red } }\n@layer tokiline.preset { .b { color: blue } }",
      expected: ["content after the @layer tokiline.preset block"],
    },
  ])("catches $name", ({ css, expected }) => {
    expect(findPresetLayerProblems(css)).toEqual(expected)
  })
})

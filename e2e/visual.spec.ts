import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  // Reveal moves parts while they scroll into view, which would make an image differ from run to run.
  await page.emulateMedia({ reducedMotion: "reduce" })
})

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
}

/** The fixture that holds the Timeline with this test id. */
function fixture(page: Page, testId: string): Locator {
  return page.locator("section.fixture").filter({ has: page.getByTestId(testId) })
}

test("index page", async ({ page }) => {
  await open(page, "/")
  // A browser that keeps visited links between tests (Firefox) would paint the links that other tests opened in the visited color,
  // which depends on which worker ran which test. The links get the unvisited color so the image does not.
  await page.addStyleTag({ content: "a:visited { color: LinkText }" })
  await expect(page).toHaveScreenshot("index-page.png", { fullPage: true })
})

const sides = ["end", "start", "rtl", "default", "mixed", "vars", "ancestor"]

for (const name of sides) {
  test(`sides ${name}`, async ({ page }) => {
    await open(page, "/pages/sides.html")
    await expect(fixture(page, name)).toHaveScreenshot(`sides-${name}.png`)
  })
}

const alternates = [
  "wide",
  "explicit",
  "md-narrow",
  "alt-attr",
  "sm-wide",
  "sm-narrow",
  "lg-narrow",
  "lg-wide",
  "never",
  "always",
  "rtl",
  "side-end",
]

for (const name of alternates) {
  test(`alternate ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await open(page, "/pages/alternate.html")
    await expect(fixture(page, name)).toHaveScreenshot(`alternate-${name}.png`)
  })
}

const themes = ["dark", "custom", "segments", "bare", "rtl-alternate"]

for (const name of themes) {
  test(`theming ${name}`, async ({ page }) => {
    await open(page, "/pages/theming.html")
    await expect(page.getByTestId(name)).toHaveScreenshot(`theming-${name}.png`)
  })
}

test("reveal plain", async ({ page }) => {
  await open(page, "/pages/reveal.html")
  await expect(page.getByTestId("plain")).toHaveScreenshot("reveal-plain.png")
})

// The 0.2 pages. Each fixture sets its own inline-size, so a Collapse threshold that depends on the width cannot move between runs.
// The horizontal fixtures with data-collapse="never" stay horizontal at any width; the collapsing ones sit in a fixed-width fixture.
const pages0_2: Record<string, { file: string; ids: string[]; sections?: string[] }> = {
  horizontal: { file: "horizontal", ids: ["h-end", "h-start", "h-alternate", "h-rtl", "h-collapse", "h-wide"] },
  variants: { file: "variants", ids: ["v-vertical", "v-horizontal"] },
  flow: {
    file: "flow",
    ids: [
      "f-single",
      "f-fork-join",
      "f-reuse",
      "f-four",
      "f-colors",
      "f-start",
      "f-alternate",
      "f-plain",
      "f-milestone",
      "f-nested",
      "fh-fork-join",
      "fh-four",
      "fh-collapse",
      "fh-collapse-start",
      "fh-alternate",
      "fh-rtl",
    ],
  },
  "preset-hotaru": {
    file: "preset-hotaru",
    ids: ["hotaru-vertical", "hotaru-horizontal", "hotaru-dark", "hotaru-none"],
  },
  "preset-kawa": { file: "preset-kawa", ids: ["kawa-vertical", "kawa-horizontal", "kawa-none"], sections: ["kawa-dark"] },
  "preset-kinen": {
    file: "preset-kinen",
    ids: ["kinen-vertical", "kinen-horizontal", "kinen-none"],
    sections: ["kinen-dark"],
  },
  "preset-flow": { file: "preset-flow", ids: ["pf-none", "pf-hotaru", "pf-kawa", "pf-kinen"] },
  reveal: { file: "reveal", ids: ["h-reveal"] },
}

for (const [name, { file, ids, sections = [] }] of Object.entries(pages0_2)) {
  for (const id of ids) {
    test(`${name} ${id}`, async ({ page }) => {
      await open(page, `/pages/${file}.html`)
      await expect(fixture(page, id)).toHaveScreenshot(`${name}-${id}.png`)
    })
  }
  // These fixtures carry the test id on the section itself (dark backgrounds), so the section is the target.
  for (const id of sections) {
    test(`${name} ${id}`, async ({ page }) => {
      await open(page, `/pages/${file}.html`)
      await expect(page.getByTestId(id)).toHaveScreenshot(`${name}-${id}.png`)
    })
  }
}

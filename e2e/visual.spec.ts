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

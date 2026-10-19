import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const pages = [
  "/",
  "/pages/sides.html",
  "/pages/alternate.html",
  "/pages/reveal.html",
  "/pages/theming.html",
  "/pages/horizontal.html",
  "/pages/variants.html",
  "/pages/flow.html",
  "/pages/preset-hotaru.html",
  "/pages/preset-kawa.html",
  "/pages/preset-kinen.html",
  "/pages/preset-flow.html",
]

for (const path of pages) {
  test(`axe finds no WCAG A or AA violation on ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()
    const found = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target.join(" ")),
    }))
    expect(found).toEqual([])
  })
}

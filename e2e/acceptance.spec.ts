import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// The acceptance page site/acceptance/portfolio.html: the career timeline of my-portfolio-second, rebuilt with tokiline's
// HTML contract, Tailwind v4 classes and shadcn/ui colors, with tokiline's CSS loaded into Tailwind's components layer.

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** How far apart two positions may be and still count as the same. */
const tolerance = 1

test.beforeEach(async ({ page }) => {
  // Reveal is not used here, but a fixed motion setting keeps every image the same from run to run.
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/acceptance/portfolio.html")
  await page.evaluate(() => document.fonts.ready)
})

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox()
  if (!found) throw new Error("the element has no bounding box")
  return found
}

/** The computed color of a probe: a hidden element that carries a Tailwind color class. */
function probeColor(page: Page, testId: string): Promise<string> {
  return page.getByTestId(testId).evaluate((element) => getComputedStyle(element).color)
}

async function useDark(page: Page): Promise<void> {
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  await page.evaluate(() => document.fonts.ready)
}

test("every Card sits at the end of its Marker and below its Meta", async ({ page }) => {
  for (const number of [1, 2, 3]) {
    const root = page.getByTestId(`career-${number}`)
    const marker = await box(root.locator(".toki-marker"))
    const meta = await box(root.locator(".toki-meta"))
    const card = await box(root.locator(".toki-card"))
    expect(marker.x + marker.width).toBeLessThanOrEqual(card.x + tolerance)
    expect(meta.y + meta.height).toBeLessThanOrEqual(card.y + tolerance)
  }
})

test("Tailwind classes beat tokiline's defaults", async ({ page }) => {
  const card = page.getByTestId("career-1-card")
  const style = await card.evaluate((element) => {
    const computed = getComputedStyle(element)
    return { paddingTop: computed.paddingTop, borderTopWidth: computed.borderTopWidth, borderTopColor: computed.borderTopColor }
  })
  expect(style.paddingTop).toBe("20px")
  expect(style.borderTopWidth).toBe("4px")
  expect(style.borderTopColor).toBe(await probeColor(page, "primary-probe"))
})

test("the shadcn/ui variables reach tokiline's custom properties", async ({ page }) => {
  const root = page.getByTestId("career-1")
  const marker = await root.locator(".toki-marker").evaluate((element) => {
    const computed = getComputedStyle(element)
    return { width: computed.width, backgroundColor: computed.backgroundColor }
  })
  expect(marker.width).toBe("32px")
  expect(marker.backgroundColor).toBe(await probeColor(page, "primary-probe"))

  const arrow = await root.locator(".toki-card").evaluate((element) => {
    const computed = getComputedStyle(element, "::before")
    return [computed.borderTopWidth, computed.borderRightWidth, computed.borderBottomWidth, computed.borderLeftWidth]
  })
  expect(arrow).toEqual(["0px", "0px", "0px", "0px"])

  const segment = await root.evaluate((element) => getComputedStyle(element, "::before").borderInlineStartColor)
  expect(segment).toBe(await probeColor(page, "border-probe"))
})

test("tokiline's rules use no !important", async ({ page }) => {
  // Tailwind's own reset has rules with !important, so only the rules of tokiline count: the ones whose selector names a
  // toki- class and the ones that declare a --toki- property.
  const result = await page.evaluate(() => {
    const flagged: string[] = []
    let inspected = 0
    const visit = (rules: CSSRuleList): void => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          const isTokiline = rule.selectorText.includes("toki") || rule.cssText.includes("--toki-")
          if (isTokiline) {
            inspected += 1
            if (rule.cssText.includes("!important")) flagged.push(rule.cssText)
          }
        }
        // Layers, media, supports and container rules, and nested style rules, all hold more rules.
        const inner = (rule as { cssRules?: CSSRuleList }).cssRules
        if (inner) visit(inner)
      }
    }
    for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules)
    return { flagged, inspected }
  })
  expect(result.inspected).toBeGreaterThan(0)
  expect(result.flagged).toEqual([])
})

test("the ongoing badge is in the Meta of the first Item", async ({ page }) => {
  await expect(page.getByTestId("career-1").locator(".toki-meta").getByText("継続中")).toBeVisible()
})

test("screenshot, light", async ({ page }) => {
  await expect(page).toHaveScreenshot("portfolio-light.png", { fullPage: true })
})

test("screenshot, dark", async ({ page }) => {
  await useDark(page)
  await expect(page).toHaveScreenshot("portfolio-dark.png", { fullPage: true })
})

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

async function violations(page: Page): Promise<{ id: string; impact: string | null | undefined; targets: string[] }[]> {
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze()
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }))
}

test("axe finds no violation, light", async ({ page }) => {
  expect(await violations(page)).toEqual([])
})

test("axe finds no violation, dark", async ({ page }) => {
  await useDark(page)
  expect(await violations(page)).toEqual([])
})

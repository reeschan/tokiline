import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// The hotaru Preset on site/pages/preset-hotaru.html. The Line's light band is an Item's ::after, and the current
// Marker's glow and ripple are its ::before and ::after, so the tests read the computed styles of pseudo-elements.
// Screenshot baselines belong to the designer; these tests only read animation names and computed styles.

interface NamedKeyframes {
  name: string
  properties: string[]
}

/** The properties a keyframe of the Preset may change: motion only, never the layout or the colors. */
const motionProperties = new Set(["opacity", "transform", "translate", "scale"])

test.use({ viewport: { width: 1400, height: 900 } })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("/pages/preset-hotaru.html")
  await page.evaluate(() => document.fonts.ready)
})

/** Lets the browser settle animations before their computed styles are read. */
async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

/** Reads the computed animation-name of an element ("" for the element itself) or one of its pseudo-elements. */
function animationName(locator: Locator, pseudo: "" | "::before" | "::after"): Promise<string> {
  return locator.evaluate((element, pseudo) => getComputedStyle(element, pseudo === "" ? null : pseudo).animationName, pseudo)
}

test("1. the current Marker breathes and the vertical Line carries a light band", async ({ page }) => {
  const current = page.getByTestId("hotaru-vertical-3")
  const marker = current.locator(".toki-marker")
  const names = await Promise.all([animationName(marker, ""), animationName(marker, "::before"), animationName(marker, "::after")])

  expect(
    names.some((name) => name !== "none"),
    `current Marker animations: ${names.join(", ")}`,
  ).toBe(true)
  expect(names).toContain("toki-hotaru-breathe")
  expect(await animationName(current, "::after")).toBe("toki-hotaru-flow-block")
})

test("2. reduced motion stops every animation and leaves the glow lit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await frames(page)

  const names = await page.evaluate(() => {
    const timelines = Array.from(document.querySelectorAll('.toki-timeline[data-preset="hotaru"]'))
    const elements = timelines.flatMap((timeline) => [timeline, ...timeline.querySelectorAll("*")])
    return elements.flatMap((element) =>
      ["", "::before", "::after"].map((pseudo) => getComputedStyle(element, pseudo === "" ? null : pseudo).animationName),
    )
  })
  expect(names.length).toBeGreaterThan(0)
  for (const name of names) expect(name).toBe("none")

  const glow = await page
    .getByTestId("hotaru-vertical-3")
    .locator(".toki-marker")
    .evaluate((marker) => {
      const style = getComputedStyle(marker, "::before")
      return { opacity: Number(style.opacity), background: style.backgroundImage }
    })
  expect(glow.opacity, "the stopped glow is still drawn").toBeGreaterThan(0)
  expect(glow.background).not.toBe("none")
})

/** The computed colors of an Item's Marker and Card. */
function defaultStyles(page: Page, testId: string) {
  return page.getByTestId(testId).evaluate((item) => {
    const marker = item.querySelector(".toki-marker")
    const card = item.querySelector(".toki-card")
    if (!marker || !card) throw new Error("the Item has no Marker or Card")
    const markerStyle = getComputedStyle(marker)
    const cardStyle = getComputedStyle(card)
    return {
      markerBackground: markerStyle.backgroundColor,
      markerShadow: markerStyle.boxShadow,
      cardBackground: cardStyle.backgroundColor,
      cardShadow: cardStyle.boxShadow,
    }
  })
}

test("3. a Timeline without data-preset looks the same as on a page without the Preset", async ({ page }) => {
  const withPresetLoaded = await defaultStyles(page, "hotaru-none-1")
  await page.goto("/pages/sides.html")
  await page.evaluate(() => document.fonts.ready)
  const withoutPreset = await defaultStyles(page, "end-1")
  expect(withPresetLoaded).toEqual(withoutPreset)
})

test("4. the horizontal Line carries the band inline, along the Marker row", async ({ page }) => {
  const items = [1, 2, 3].map((n) => page.getByTestId(`hotaru-horizontal-${n}`))
  expect(await animationName(items[0]!, "::after")).toBe("toki-hotaru-flow-inline")

  const markers = await Promise.all(
    items.map(async (item) => {
      const box = await item.locator(".toki-marker").boundingBox()
      if (!box) throw new Error("the Marker has no bounding box")
      return box
    }),
  )
  expect(markers[1]!.x, "the Items run inline").toBeGreaterThan(markers[0]!.x)
  expect(Math.abs(markers[1]!.y - markers[0]!.y), "the Markers share one Line").toBeLessThanOrEqual(1)
})

test("5. the Preset's keyframes change motion properties only", async ({ page }) => {
  const keyframes = await page.evaluate<NamedKeyframes[]>(() => {
    const found: NamedKeyframes[] = []
    const visit = (rule: CSSRule): void => {
      if (rule instanceof CSSKeyframesRule) {
        for (const frame of Array.from(rule.cssRules))
          if (frame instanceof CSSKeyframeRule) found.push({ name: rule.name, properties: Array.from(frame.style) })
      } else if ("cssRules" in rule) {
        for (const inner of Array.from((rule as CSSGroupingRule).cssRules)) visit(inner)
      }
    }
    for (const sheet of Array.from(document.styleSheets)) for (const rule of Array.from(sheet.cssRules)) visit(rule)
    return found.filter(({ name }) => name.startsWith("toki-hotaru-"))
  })

  expect(keyframes.map(({ name }) => name)).toEqual(
    expect.arrayContaining(["toki-hotaru-flow-block", "toki-hotaru-flow-inline", "toki-hotaru-breathe"]),
  )
  for (const { name, properties } of keyframes) {
    for (const property of properties) expect(motionProperties.has(property), `${name} changes ${property}`).toBe(true)
    if (name.includes("flow")) expect(properties, `${name} only translates`).toEqual(["transform"])
  }
})

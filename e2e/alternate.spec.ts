import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

test.use({ viewport: { width: 1400, height: 900 } })

test.beforeEach(async ({ page }) => {
  await page.goto("/pages/alternate.html")
  await page.evaluate(() => document.fonts.ready)
})

function item(page: Page, testId: string) {
  const root = page.getByTestId(testId)
  return { root, marker: root.locator(".toki-marker"), meta: root.locator(".toki-meta"), card: root.locator(".toki-card") }
}

async function box(locator: Locator) {
  const found = await locator.boundingBox()
  if (!found) throw new Error("the part has no bounding box")
  return found
}

function expectNear(actual: number, expected: number, tolerance = 1) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

async function expectSide(page: Page, testId: string, side: "start" | "end") {
  const { marker, card } = item(page, testId)
  const [markerBox, cardBox] = await Promise.all([box(marker), box(card)])
  if (side === "start") expect(cardBox.x + cardBox.width, testId).toBeLessThanOrEqual(markerBox.x + 1)
  else expect(markerBox.x + markerBox.width, testId).toBeLessThanOrEqual(cardBox.x + 1)
}

async function expectCollapsed(page: Page, timeline: string) {
  for (const n of [1, 2]) {
    await expectSide(page, `${timeline}-${n}`, "end")
    const { meta, card } = item(page, `${timeline}-${n}`)
    const [metaBox, cardBox] = await Promise.all([box(meta), box(card)])
    expect(metaBox.y + metaBox.height).toBeLessThanOrEqual(cardBox.y + 1)
  }
}

function beforeStyle<const Name extends string>(locator: Locator, names: readonly Name[]): Promise<Record<Name, string>> {
  return locator.evaluate((element, names) => {
    const style = getComputedStyle(element, "::before")
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)])) as Record<Name, string>
  }, names)
}

test("1. wide: Cards alternate, Markers center on the Timeline, and Meta aligns opposite the Card", async ({ page }) => {
  const timeline = await box(page.getByTestId("wide"))
  for (const n of [1, 2, 3, 4]) {
    await expectSide(page, `wide-${n}`, n % 2 === 1 ? "start" : "end")
    const marker = await box(item(page, `wide-${n}`).marker)
    expectNear(marker.x + marker.width / 2, timeline.x + timeline.width / 2)
  }
  for (const n of [1, 2]) {
    const { marker, meta, card } = item(page, `wide-${n}`)
    const [markerBox, metaBox, cardBox] = await Promise.all([box(marker), box(meta), box(card)])
    if (n === 1) expect(markerBox.x + markerBox.width).toBeLessThanOrEqual(metaBox.x + 1)
    else {
      expect(metaBox.x + metaBox.width).toBeLessThanOrEqual(markerBox.x + 1)
      expect(await meta.evaluate((element) => getComputedStyle(element).textAlign)).toBe("end")
    }
    expectNear(metaBox.y + metaBox.height / 2, markerBox.y + markerBox.height / 2, 2)
    expectNear(cardBox.y, markerBox.y)
  }
})

test("2. explicit: only Items without data-side count towards alternation", async ({ page }) => {
  const sides = ["start", "start", "end", "end", "start"] as const
  for (const [index, side] of sides.entries()) await expectSide(page, `explicit-${index + 1}`, side)
})

test("3. md-narrow: both Cards Collapse below their Meta on the end Side", async ({ page }) => {
  await expectCollapsed(page, "md-narrow")
})

test("4. alt-attr: explicit Alternate matches the default", async ({ page }) => {
  await expectSide(page, "alt-attr-1", "start")
  await expectSide(page, "alt-attr-2", "end")
})

test("5. sm: 36rem expands and 30rem Collapses", async ({ page }) => {
  await expectSide(page, "sm-wide-1", "start")
  await expectCollapsed(page, "sm-narrow")
})

test("6. lg: 60rem Collapses and 70rem expands", async ({ page }) => {
  await expectCollapsed(page, "lg-narrow")
  await expectSide(page, "lg-wide-1", "start")
})

test("7. never expands at 25rem and always Collapses at 70rem", async ({ page }) => {
  await expectSide(page, "never-1", "start")
  await expectCollapsed(page, "always")
})

test("8. rtl: the first Card is on the logical start Side", async ({ page }) => {
  const { marker, card } = item(page, "rtl-1")
  const [markerBox, cardBox] = await Promise.all([box(marker), box(card)])
  expect(markerBox.x + markerBox.width).toBeLessThanOrEqual(cardBox.x + 1)
})

test("9. side-end: a wide one-sided Timeline does not alternate", async ({ page }) => {
  await expectCollapsed(page, "side-end")
})

test("10. expanded and Collapsed Segments run through their Marker centers", async ({ page }) => {
  for (const testId of ["wide-1", "md-narrow-1"]) {
    const { root, marker } = item(page, testId)
    const [itemBox, markerBox, segment] = await Promise.all([box(root), box(marker), beforeStyle(root, ["left", "border-left-width"])])
    const lineCenter = itemBox.x + Number.parseFloat(segment.left) + Number.parseFloat(segment["border-left-width"]) / 2
    expectNear(lineCenter, markerBox.x + markerBox.width / 2)
  }
})

test("11. a start Card's Arrow points end from its inline-end edge", async ({ page }) => {
  const { card } = item(page, "wide-1")
  const arrow = await beforeStyle(card, ["border-inline-start-width", "left"])
  // Percentage insets use the padding box, as in layout.spec.ts.
  const cardWidth = await card.evaluate((element) => element.clientWidth)
  expect(Number.parseFloat(arrow["border-inline-start-width"])).toBeGreaterThan(0)
  expectNear(Number.parseFloat(arrow.left), cardWidth)
})

test("12. the page does not scroll sideways", async ({ page }) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})

test("13. md-attr: an explicit data-collapse=md matches the default", async ({ page }) => {
  await expectSide(page, "md-attr-1", "start")
  await expectCollapsed(page, "md-attr-narrow")
})

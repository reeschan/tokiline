import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// The layout of one-sided Timelines (Side start and end) on site/pages/sides.html. Positions come from boundingBox() and
// allow 1px of rounding. The Segment (an Item's ::before) and the Arrow (a Card's ::before) have no box of their own to
// measure, so their tests read the computed styles of the pseudo-elements.

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** How far apart two positions may be and still count as the same. */
const tolerance = 1

test.beforeEach(async ({ page }) => {
  await page.goto("/pages/sides.html")
})

/** The Item with this data-testid and its parts. */
function item(page: Page, testId: string) {
  const root = page.getByTestId(testId)
  return { root, marker: root.locator(".toki-marker"), meta: root.locator(".toki-meta"), card: root.locator(".toki-card") }
}

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox()
  if (!found) throw new Error("the element has no bounding box")
  return found
}

const right = (b: Box) => b.x + b.width
const bottom = (b: Box) => b.y + b.height
const centerX = (b: Box) => b.x + b.width / 2
const centerY = (b: Box) => b.y + b.height / 2
const px = (value: string) => Number.parseFloat(value)

/** Asserts that a ≤ b, allowing the tolerance. */
function expectAtMost(a: number, b: number, what: string) {
  expect(a, `${what} (${a} and ${b})`).toBeLessThanOrEqual(b + tolerance)
}

/** Asserts that a = b, allowing the tolerance (or the one given). */
function expectNear(a: number, b: number, what: string, within = tolerance) {
  expect(Math.abs(a - b), `${what} (${a} and ${b})`).toBeLessThanOrEqual(within)
}

/** Reads computed properties of an element's ::before: the Segment of an Item, or the Arrow of a Card. */
function beforeStyle<const Name extends string>(locator: Locator, names: readonly Name[]): Promise<Record<Name, string>> {
  return locator.evaluate((element, names) => {
    const style = getComputedStyle(element, "::before")
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)])) as Record<Name, string>
  }, names)
}

/** Where the Segment's line is centered across the Item, from the inline-start offset and border of the Item's ::before. */
async function lineCenterX(itemRoot: Locator): Promise<number> {
  const [itemBox, segment] = await Promise.all([
    box(itemRoot),
    beforeStyle(itemRoot, ["direction", "left", "right", "border-left-width", "border-right-width"]),
  ])
  if (segment.direction === "rtl") return right(itemBox) - px(segment.right) - px(segment["border-right-width"]) / 2
  return itemBox.x + px(segment.left) + px(segment["border-left-width"]) / 2
}

test("1. end-1: the Card is on the end Side under the Meta, and the Marker is at the top of the Item", async ({ page }) => {
  const { root, marker, meta, card } = item(page, "end-1")
  const [itemBox, markerBox, metaBox, cardBox] = await Promise.all([box(root), box(marker), box(meta), box(card)])

  expectAtMost(right(markerBox), cardBox.x, "Marker right ≤ Card left")
  expectAtMost(bottom(metaBox), cardBox.y, "Meta bottom ≤ Card top")
  expectAtMost(right(markerBox), metaBox.x, "Marker right ≤ Meta left")
  expectNear(markerBox.y, itemBox.y, "Marker top = Item top")
})

test("2. end-2: without a Meta, the Card starts at the top of the Item, on the end Side", async ({ page }) => {
  const { root, marker, card } = item(page, "end-2")
  const [itemBox, markerBox, cardBox] = await Promise.all([box(root), box(marker), box(card)])

  expectNear(cardBox.y, itemBox.y, "Card top = Item top")
  expectAtMost(right(markerBox), cardBox.x, "Marker right ≤ Card left")
})

test("3. end-3: an empty Marker is still visible", async ({ page }) => {
  const markerBox = await box(item(page, "end-3").marker)

  expect(markerBox.width).toBeGreaterThan(0)
  expect(markerBox.height).toBeGreaterThan(0)
})

test("4. start-1: the Card is on the start Side under the Meta", async ({ page }) => {
  const { marker, meta, card } = item(page, "start-1")
  const [markerBox, metaBox, cardBox] = await Promise.all([box(marker), box(meta), box(card)])

  expectAtMost(right(cardBox), markerBox.x, "Card right ≤ Marker left")
  expectAtMost(bottom(metaBox), cardBox.y, "Meta bottom ≤ Card top")
  expectAtMost(right(metaBox), markerBox.x, "Meta right ≤ Marker left")
})

test("5. rtl-1: right to left, the end Side is on the left", async ({ page }) => {
  const { marker, card } = item(page, "rtl-1")
  const [markerBox, cardBox] = await Promise.all([box(marker), box(card)])

  expectAtMost(right(cardBox), markerBox.x, "Card right ≤ Marker left")
})

test("6. default-1: a Timeline without data-side puts the Card on the end Side", async ({ page }) => {
  const { marker, card } = item(page, "default-1")
  const [markerBox, cardBox] = await Promise.all([box(marker), box(card)])

  expectAtMost(right(markerBox), cardBox.x, "Marker right ≤ Card left")
})

test("7. mixed-1 and mixed-2: a start Timeline ignores an Item's data-side", async ({ page }) => {
  for (const testId of ["mixed-1", "mixed-2"]) {
    const { marker, card } = item(page, testId)
    const [markerBox, cardBox] = await Promise.all([box(marker), box(card)])

    expectAtMost(right(cardBox), markerBox.x, `${testId}: Card right ≤ Marker left`)
  }
})

test("8. end-1: the icon is centered in the Marker", async ({ page }) => {
  const [iconBox, markerBox] = await Promise.all([box(page.getByTestId("end-1-icon")), box(item(page, "end-1").marker)])

  expectNear(centerX(iconBox), centerX(markerBox), "icon center x = Marker center x")
  expectNear(centerY(iconBox), centerY(markerBox), "icon center y = Marker center y")
})

test("9. the Segment's line runs through the center of the Marker (end-1, start-1, rtl-1)", async ({ page }) => {
  for (const testId of ["end-1", "start-1", "rtl-1"]) {
    const { root, marker } = item(page, testId)
    const [lineX, markerBox] = await Promise.all([lineCenterX(root), box(marker)])

    expectNear(lineX, centerX(markerBox), `${testId}: line center x = Marker center x`)
  }
})

test("10. vars-1: an Item's own custom properties style its Segment", async ({ page }) => {
  const custom = await beforeStyle(page.getByTestId("vars-1"), ["border-inline-start-style", "border-inline-start-color"])
  const plain = await beforeStyle(page.getByTestId("end-1"), ["border-inline-start-style"])

  expect(custom).toEqual({ "border-inline-start-style": "dashed", "border-inline-start-color": "rgb(255, 0, 0)" })
  expect(plain["border-inline-start-style"]).toBe("solid")
})

test("11. ancestor-1: a custom property set on an ancestor reaches the Segment", async ({ page }) => {
  const segment = await beforeStyle(page.getByTestId("ancestor-1"), ["border-inline-start-color"])

  expect(segment["border-inline-start-color"]).toBe("rgb(0, 128, 0)")
})

test("12. the Segment spans the whole Item, and the gap after the last Item is 0", async ({ page }) => {
  const segment = await beforeStyle(page.getByTestId("end-1"), ["top", "bottom"])
  const firstPadding = await page.getByTestId("end-1").evaluate((element) => getComputedStyle(element).paddingBlockEnd)
  const lastPadding = await page.getByTestId("end-3").evaluate((element) => getComputedStyle(element).paddingBlockEnd)

  expect(segment).toEqual({ top: "0px", bottom: "0px" })
  expect(px(firstPadding)).toBeGreaterThan(0)
  expect(lastPadding).toBe("0px")
})

test("13. vars-2: a Marker size and an Arrow size of 0 hide both", async ({ page }) => {
  const { marker, card } = item(page, "vars-2")
  const markerBox = await box(marker)
  const arrow = await beforeStyle(card, ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"])

  expect(markerBox.width).toBe(0)
  expect(markerBox.height).toBe(0)
  expect(arrow).toEqual({
    "border-top-width": "0px",
    "border-right-width": "0px",
    "border-bottom-width": "0px",
    "border-left-width": "0px",
  })
})

test("14. the Arrow sits outside the Card's edge next to the Line, in the Card's color, level with the Marker", async ({ page }) => {
  // inset-inline-end / inset-inline-start: 100% resolve against the Card's padding box, so "the Card's width" here is
  // clientWidth: the Card's width without its border.
  const end = item(page, "end-2")
  const endArrow = await beforeStyle(end.card, ["border-inline-end-width", "border-inline-end-color", "right", "top", "border-top-width"])
  const endCard = await end.card.evaluate((card) => ({ background: getComputedStyle(card).backgroundColor, width: card.clientWidth }))
  const [cardBox, markerBox] = await Promise.all([box(end.card), box(end.marker)])

  expect(px(endArrow["border-inline-end-width"])).toBeGreaterThan(0)
  expect(endArrow["border-inline-end-color"]).toBe(endCard.background)
  expectNear(px(endArrow.right), endCard.width, "end-2: Arrow right = Card width")
  expectNear(
    cardBox.y + px(endArrow.top) + px(endArrow["border-top-width"]),
    centerY(markerBox),
    "end-2: Arrow center y = Marker center y",
    1.5,
  )

  const start = item(page, "start-2")
  const startArrow = await beforeStyle(start.card, ["border-inline-start-width", "left"])
  const startCardWidth = await start.card.evaluate((card) => card.clientWidth)

  expect(px(startArrow["border-inline-start-width"])).toBeGreaterThan(0)
  expectNear(px(startArrow.left), startCardWidth, "start-2: Arrow left = Card width")
})

test("15. a Timeline has no list markers and no inline-start padding", async ({ page }) => {
  const timelines = await page.locator(".toki-timeline").evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      return { listStyleType: style.listStyleType, paddingInlineStart: style.paddingInlineStart }
    }),
  )

  expect(timelines).toHaveLength(7)
  for (const timeline of timelines) expect(timeline).toEqual({ listStyleType: "none", paddingInlineStart: "0px" })
})

test("16. the page does not scroll sideways", async ({ page }) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})

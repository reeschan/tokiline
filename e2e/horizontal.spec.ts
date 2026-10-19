import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// The horizontal Orientation on site/pages/horizontal.html. The Line runs inline: the Marker row is shared by every
// Item through a subgrid, so the Line stays on one height even when the Cards above or below it differ in height.
// Positions come from boundingBox() and allow 1px of rounding. The Arrow (a Card's ::before) has no box of its own to
// measure, so its tests read the computed styles of the pseudo-element.

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** How far apart two positions may be and still count as the same. */
const tolerance = 1

test.use({ viewport: { width: 1400, height: 900 } })

test.beforeEach(async ({ page }) => {
  await page.goto("/pages/horizontal.html")
  await page.evaluate(() => document.fonts.ready)
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
const centerY = (b: Box) => b.y + b.height / 2
const px = (value: string) => Number.parseFloat(value)

/** Asserts that a ≤ b, allowing the tolerance. */
function expectAtMost(a: number, b: number, what: string) {
  expect(a, `${what} (${a} and ${b})`).toBeLessThanOrEqual(b + tolerance)
}

/** Asserts that a = b, allowing the tolerance. */
function expectNear(a: number, b: number, what: string) {
  expect(Math.abs(a - b), `${what} (${a} and ${b})`).toBeLessThanOrEqual(tolerance)
}

/** Reads computed properties of an element's ::before: the Arrow of a Card. */
function beforeStyle<const Name extends string>(locator: Locator, names: readonly Name[]): Promise<Record<Name, string>> {
  return locator.evaluate((element, names) => {
    const style = getComputedStyle(element, "::before")
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)])) as Record<Name, string>
  }, names)
}

const endItems = [1, 2, 3, 4, 5].map((n) => `h-end-${n}`)
const startItems = [1, 2, 3, 4, 5].map((n) => `h-start-${n}`)
const alternateItems = [1, 2, 3, 4, 5].map((n) => `h-alternate-${n}`)
const rtlItems = [1, 2, 3, 4, 5].map((n) => `h-rtl-${n}`)

test("1. h-end: every Marker is on one Line and the Items run inline", async ({ page }) => {
  const markers = await Promise.all(endItems.map((testId) => box(item(page, testId).marker)))
  const roots = await Promise.all(endItems.map((testId) => box(item(page, testId).root)))
  const cards = await Promise.all(endItems.map((testId) => box(item(page, testId).card)))

  for (const [index, markerBox] of markers.entries())
    expectNear(centerY(markerBox), centerY(markers[0]!), `${endItems[index]}: Marker center y`)
  for (const [index, root] of roots.entries()) {
    if (index === 0) continue
    expect(root.x, `${endItems[index]}: Item x`).toBeGreaterThan(roots[index - 1]!.x)
  }
  // The Line stays straight although the Cards have different heights.
  expect(new Set(cards.map((card) => Math.round(card.height))).size).toBeGreaterThan(1)
})

test("2. h-end: the Card is below the Line and the Meta above it", async ({ page }) => {
  for (const testId of endItems) {
    const { marker, meta, card } = item(page, testId)
    const [markerBox, metaBox, cardBox] = await Promise.all([box(marker), box(meta), box(card)])
    expectAtMost(centerY(markerBox), cardBox.y, `${testId}: Marker center y ≤ Card top`)
    expectAtMost(bottom(metaBox), centerY(markerBox), `${testId}: Meta bottom ≤ Marker center y`)
  }
})

test("3. h-start: the Card is above the Line and the Meta below it", async ({ page }) => {
  for (const testId of startItems) {
    const { marker, meta, card } = item(page, testId)
    const [markerBox, metaBox, cardBox] = await Promise.all([box(marker), box(meta), box(card)])
    expectAtMost(bottom(cardBox), centerY(markerBox), `${testId}: Card bottom ≤ Marker center y`)
    expectAtMost(centerY(markerBox), metaBox.y, `${testId}: Marker center y ≤ Meta top`)
  }
})

test("4. h-alternate: the Cards alternate around one Line", async ({ page }) => {
  const markers = await Promise.all(alternateItems.map((testId) => box(item(page, testId).marker)))
  for (const [index, markerBox] of markers.entries()) {
    const { meta, card } = item(page, alternateItems[index]!)
    const [metaBox, cardBox] = await Promise.all([box(meta), box(card)])
    expectNear(centerY(markerBox), centerY(markers[0]!), `${alternateItems[index]}: Marker center y`)
    if (index % 2 === 0) {
      expectAtMost(bottom(cardBox), centerY(markerBox), `${alternateItems[index]}: Card bottom ≤ Marker center y`)
      expectAtMost(centerY(markerBox), metaBox.y, `${alternateItems[index]}: Marker center y ≤ Meta top`)
    } else {
      expectAtMost(centerY(markerBox), cardBox.y, `${alternateItems[index]}: Marker center y ≤ Card top`)
      expectAtMost(bottom(metaBox), centerY(markerBox), `${alternateItems[index]}: Meta bottom ≤ Marker center y`)
    }
  }
})

test("5. h-rtl: the Items run from right to left", async ({ page }) => {
  const roots = await Promise.all(rtlItems.map((testId) => box(item(page, testId).root)))
  for (const [index, root] of roots.entries()) {
    if (index === 0) continue
    expect(root.x, `${rtlItems[index]}: Item x`).toBeLessThan(roots[index - 1]!.x)
  }
})

test("6. h-collapse: a narrow Timeline is vertical, with the Cards on the end Side", async ({ page }) => {
  const roots: Box[] = []
  for (const n of [1, 2, 3, 4]) {
    const { root, marker, card } = item(page, `h-collapse-${n}`)
    const [rootBox, markerBox, cardBox] = await Promise.all([box(root), box(marker), box(card)])
    roots.push(rootBox)
    expectAtMost(right(markerBox), cardBox.x, `h-collapse-${n}: Marker right ≤ Card left`)
  }
  for (const [index, root] of roots.entries()) {
    if (index === 0) continue
    expect(root.y, `h-collapse-${index + 1}: Item y`).toBeGreaterThan(roots[index - 1]!.y)
  }
})

test("7. h-wide: a wide Timeline stays horizontal", async ({ page }) => {
  const roots = await Promise.all([1, 2, 3, 4, 5].map((n) => box(item(page, `h-wide-${n}`).root)))
  for (const [index, root] of roots.entries()) {
    expectNear(root.y, roots[0]!.y, `h-wide-${index + 1}: Item y`)
    if (index > 0) expect(root.x, `h-wide-${index + 1}: Item x`).toBeGreaterThan(roots[index - 1]!.x)
  }
})

test("8. the horizontal Timelines scroll inline and have no block overflow", async ({ page }) => {
  // Not the computed overflow-block value: the block axis must simply have nothing to scroll. h-start and h-alternate
  // put Cards on the block-start side, so they cover a different set of shadows and rows from h-end.
  for (const testId of ["h-end", "h-start", "h-alternate"]) {
    const metrics = await page.getByTestId(testId).evaluate((timeline) => ({
      scrollWidth: timeline.scrollWidth,
      clientWidth: timeline.clientWidth,
      scrollHeight: timeline.scrollHeight,
      clientHeight: timeline.clientHeight,
    }))

    expect(metrics.scrollWidth, `${testId}: scrollWidth > clientWidth`).toBeGreaterThan(metrics.clientWidth)
    expect(metrics.scrollHeight, `${testId}: scrollHeight ≤ clientHeight`).toBeLessThanOrEqual(metrics.clientHeight + tolerance)
  }
})

test("9. h-end and h-start: the Arrow points toward the Line", async ({ page }) => {
  const endArrow = await beforeStyle(item(page, "h-end-1").card, ["border-top-width", "border-bottom-width"])
  expect(px(endArrow["border-top-width"]), "h-end: no border above the Arrow").toBe(0)
  expect(px(endArrow["border-bottom-width"]), "h-end: the Arrow points up").toBeGreaterThan(0)

  const startArrow = await beforeStyle(item(page, "h-start-1").card, ["border-top-width", "border-bottom-width"])
  expect(px(startArrow["border-top-width"]), "h-start: the Arrow points down").toBeGreaterThan(0)
  expect(px(startArrow["border-bottom-width"]), "h-start: no border below the Arrow").toBe(0)
})

test("10. h-end: an Item is --toki-item-size wide and the gap is --toki-gap", async ({ page }) => {
  const [first, second] = await Promise.all([box(item(page, "h-end-1").root), box(item(page, "h-end-2").root)])
  const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))

  expectNear(first.width, 16 * rem, "Item width = 16rem")
  expectNear(second.x - right(first), 2 * rem, "gap = 2rem")
})

test("11. the page does not scroll sideways", async ({ page }) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})

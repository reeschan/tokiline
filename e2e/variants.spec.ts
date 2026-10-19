import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// The Variants and Status on site/pages/variants.html. Positions come from boundingBox() and allow 1px of rounding.
// The Segment (an Item's ::before) and the Arrow (a Card's ::before) have no box of their own, so their tests read the
// computed styles of the pseudo-element.

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
  await page.goto("/pages/variants.html")
  await page.evaluate(() => document.fonts.ready)
})

/** The Item with this data-testid and its parts. */
function item(page: Page, testId: string) {
  const root = page.getByTestId(testId)
  return { root, marker: root.locator(".toki-marker"), card: root.locator(".toki-card") }
}

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox()
  if (!found) throw new Error("the element has no bounding box")
  return found
}

const centerX = (b: Box) => b.x + b.width / 2
const centerY = (b: Box) => b.y + b.height / 2
const px = (value: string) => Number.parseFloat(value)

/** Asserts that a = b, allowing the tolerance. */
function expectNear(a: number, b: number, what: string) {
  expect(Math.abs(a - b), `${what} (${a} and ${b})`).toBeLessThanOrEqual(tolerance)
}

/** Reads computed properties of an element's ::before. */
function beforeStyle<const Name extends string>(locator: Locator, names: readonly Name[]): Promise<Record<Name, string>> {
  return locator.evaluate((element, names) => {
    const style = getComputedStyle(element, "::before")
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)])) as Record<Name, string>
  }, names)
}

const verticalItems = [1, 2, 3, 4, 5, 6].map((n) => `v-vertical-${n}`)
const horizontalItems = [1, 2, 3, 4, 5, 6].map((n) => `v-horizontal-${n}`)

test("1. vertical: compact and milestone resize the Marker around the same Line", async ({ page }) => {
  const markers = await Promise.all(verticalItems.map((testId) => box(item(page, testId).marker)))
  const regular = markers[0]!
  const compact = markers[1]!
  const milestone = markers[2]!

  expect(compact.width, "compact Marker width < regular").toBeLessThan(regular.width)
  expect(compact.height, "compact Marker height < regular").toBeLessThan(regular.height)
  expect(milestone.width, "milestone Marker width > regular").toBeGreaterThan(regular.width)
  expect(milestone.height, "milestone Marker height > regular").toBeGreaterThan(regular.height)

  for (const [index, marker] of markers.entries()) expectNear(centerX(marker), centerX(regular), `${verticalItems[index]}: Marker center x`)
})

test("2. horizontal: compact and milestone resize the Marker around the same Line", async ({ page }) => {
  const markers = await Promise.all(horizontalItems.map((testId) => box(item(page, testId).marker)))
  const regular = markers[0]!
  const compact = markers[1]!
  const milestone = markers[2]!

  expect(compact.width, "compact Marker width < regular").toBeLessThan(regular.width)
  expect(compact.height, "compact Marker height < regular").toBeLessThan(regular.height)
  expect(milestone.width, "milestone Marker width > regular").toBeGreaterThan(regular.width)
  expect(milestone.height, "milestone Marker height > regular").toBeGreaterThan(regular.height)

  for (const [index, marker] of markers.entries())
    expectNear(centerY(marker), centerY(regular), `${horizontalItems[index]}: Marker center y`)
})

test("3. compact: the Card has no frame, no padding and no Arrow", async ({ page }) => {
  for (const testId of ["v-vertical-2", "v-horizontal-2"]) {
    const style = await item(page, testId).card.evaluate((card) => {
      const computed = getComputedStyle(card)
      return {
        borderTopWidth: computed.borderTopWidth,
        borderRightWidth: computed.borderRightWidth,
        borderBottomWidth: computed.borderBottomWidth,
        borderLeftWidth: computed.borderLeftWidth,
        paddingTop: computed.paddingTop,
        paddingLeft: computed.paddingLeft,
        backgroundColor: computed.backgroundColor,
        boxShadow: computed.boxShadow,
      }
    })

    for (const [name, value] of Object.entries(style)) {
      if (name === "backgroundColor") expect(value, `${testId}: ${name}`).toMatch(/^(?:rgba\(0, 0, 0, 0\)|transparent)$/)
      else if (name === "boxShadow") expect(value, `${testId}: ${name}`).toBe("none")
      else expect(px(value), `${testId}: ${name}`).toBe(0)
    }

    const arrow = await beforeStyle(item(page, testId).card, [
      "border-top-width",
      "border-right-width",
      "border-bottom-width",
      "border-left-width",
    ])
    for (const [name, value] of Object.entries(arrow)) expect(px(value), `${testId}: Arrow ${name}`).toBe(0)
  }
})

test("4. milestone: the Card border is the accent color and thicker than the default", async ({ page }) => {
  for (const testId of ["v-vertical-3", "v-horizontal-3"]) {
    const style = await item(page, testId).card.evaluate((card) => {
      const computed = getComputedStyle(card)
      return {
        borderTopWidth: computed.borderTopWidth,
        borderTopStyle: computed.borderTopStyle,
        borderTopColor: computed.borderTopColor,
        color: computed.color,
      }
    })

    expect(px(style.borderTopWidth), `${testId}: Card border width`).toBe(2)
    expect(style.borderTopStyle, `${testId}: Card border style`).toBe("solid")
    expect(style.borderTopColor, `${testId}: Card border uses the accent (currentColor here)`).toBe(style.color)
  }
})

test("5. upcoming: the Segment is dashed and a plain Item's is solid", async ({ page }) => {
  const verticalRegular = await beforeStyle(item(page, "v-vertical-1").root, ["border-left-style"])
  const verticalUpcoming = await beforeStyle(item(page, "v-vertical-6").root, ["border-left-style"])
  expect(verticalRegular["border-left-style"], "vertical: plain Segment").toBe("solid")
  expect(verticalUpcoming["border-left-style"], "vertical: upcoming Segment").toBe("dashed")

  const horizontalRegular = await beforeStyle(item(page, "v-horizontal-1").root, ["border-top-style"])
  const horizontalUpcoming = await beforeStyle(item(page, "v-horizontal-6").root, ["border-top-style"])
  expect(horizontalRegular["border-top-style"], "horizontal: plain Segment").toBe("solid")
  expect(horizontalUpcoming["border-top-style"], "horizontal: upcoming Segment").toBe("dashed")
})

test("6. current: the Marker gets a ring outside the default one", async ({ page }) => {
  for (const [regularId, currentId] of [
    ["v-vertical-1", "v-vertical-5"],
    ["v-horizontal-1", "v-horizontal-5"],
  ] as const) {
    const regular = await item(page, regularId).marker.evaluate((marker) => getComputedStyle(marker).boxShadow)
    const current = await item(page, currentId).marker.evaluate((marker) => getComputedStyle(marker).boxShadow)
    expect(current, `${currentId}: box-shadow differs from ${regularId}`).not.toBe(regular)
  }
})

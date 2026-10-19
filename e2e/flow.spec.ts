import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// The Flow layout on site/pages/flow.html. In a vertical Flow the Lane columns form a band whose width is the
// Timeline's --toki-lane-gap times its data-flow count, and every Card and Meta sits in one column outside it. In a
// horizontal Flow the band is that tall, the Marker sits on its Lane row at the inline-start of the Item, and the Card
// and Meta share the one row below or above the band. A narrow horizontal Flow collapses to the vertical Flow, and in a
// right-to-left writing mode the background-drawn Lines are measured from the right edge. Positions come from
// boundingBox() and allow 1px of rounding. The bends (a Marker's ::before and an Item's ::after) have no box of their
// own to measure, so their tests read the computed styles of the pseudo-elements.

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
  await page.goto("/pages/flow.html")
  await page.evaluate(() => document.fonts.ready)
})

/** The Item with this data-testid and its parts. A Card may hold a nested Timeline, so only the Item's own children count. */
function item(page: Page, testId: string) {
  const root = page.getByTestId(testId)
  return {
    root,
    marker: root.locator(":scope > .toki-marker"),
    meta: root.locator(":scope > .toki-meta"),
    card: root.locator(":scope > .toki-card"),
  }
}

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox()
  if (!found) throw new Error("the element has no bounding box")
  return found
}

const right = (b: Box) => b.x + b.width
const centerX = (b: Box) => b.x + b.width / 2
const centerY = (b: Box) => b.y + b.height / 2
const px = (value: string) => Number.parseFloat(value)

/** Asserts that a = b, allowing the tolerance. */
function expectNear(a: number, b: number, what: string) {
  expect(Math.abs(a - b), `${what} (${a} and ${b})`).toBeLessThanOrEqual(tolerance)
}

/** The resolved --toki-lane-gap of the Timeline with this test id, in px. */
async function laneGap(page: Page, testId: string): Promise<number> {
  return page.getByTestId(testId).evaluate((timeline) => {
    const probe = document.createElement("div")
    probe.style.inlineSize = getComputedStyle(timeline).getPropertyValue("--toki-lane-gap").trim() || "3rem"
    document.body.append(probe)
    const width = probe.getBoundingClientRect().width
    probe.remove()
    return width
  })
}

/** Splits a computed, comma-separated background list into its layers. */
function layers(value: string): string[] {
  return value.split(", ")
}

/** The alpha of a computed color: 1 when the color leaves it out. */
function colorAlpha(color: string): number {
  const modern = /\/\s*([0-9.]+%?)\s*\)$/.exec(color)
  if (modern) return alphaValue(modern[1]!)
  const legacy = /^rgba\([^)]*,\s*([0-9.]+)\s*\)$/i.exec(color)
  return legacy ? Number.parseFloat(legacy[1]!) : 1
}

function alphaValue(value: string): number {
  return value.endsWith("%") ? Number.parseFloat(value) / 100 : Number.parseFloat(value)
}

/** Reads computed properties of an element's pseudo-element. */
function pseudoStyle<const Name extends string>(
  locator: Locator,
  pseudo: "::before" | "::after",
  names: readonly Name[],
): Promise<Record<Name, string>> {
  return locator.evaluate(
    (element, { pseudo, names }) => {
      const style = getComputedStyle(element, pseudo)
      return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)])) as Record<Name, string>
    },
    { pseudo, names },
  )
}

/** The Box of an Item and of its Marker, Card and Meta. */
async function boxes(page: Page, testId: string) {
  const parts = item(page, testId)
  const [root, marker, card, meta] = await Promise.all([box(parts.root), box(parts.marker), box(parts.card), box(parts.meta)])
  return { root, marker, card, meta }
}

/** How far a part starts from the inline-start of its Item, in px. */
const startOffset = (root: Box, part: Box) => part.x - root.x

/** How far a part ends from the inline-end of its Item, in px. */
const endOffset = (root: Box, part: Box) => right(root) - right(part)

/** The first component of a computed background value, keeping a calc() with spaces together. */
function firstComponent(value: string): string {
  const text = value.trim()
  if (!text.toLowerCase().startsWith("calc(")) return text.split(/\s+/)[0]!
  let depth = 0
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1
    else if (text[index] === ")") {
      depth -= 1
      if (depth === 0) return text.slice(0, index + 1)
    }
  }
  return text
}

/** A length in a computed background value, with a percentage resolved against the given span. */
function resolvedLength(value: string, span: number): number {
  const calc = /^calc\(\s*100%\s*-\s*([0-9.]+)px\s*\)$/i.exec(value.trim())
  if (calc) return span - Number.parseFloat(calc[1]!)
  if (value.endsWith("%")) return (Number.parseFloat(value) / 100) * span
  return px(value)
}

/** The left edge of a background layer, from its computed x position, width and box width. */
function backgroundLeft(position: string, layerWidth: number, boxWidth: number): number {
  const text = position.trim()
  const tokens = text.split(/\s+/)
  if (tokens[0] === "left") return px(tokens[1]!)
  if (tokens[0] === "right") return boxWidth - layerWidth - px(tokens[1]!)
  // A plain length, or a percentage of the space the layer can move in (the box minus the layer).
  return resolvedLength(firstComponent(text), boxWidth - layerWidth)
}

/** The own Lane's Line of a horizontal Item, from the background of its ::before, in px from the physical left. */
async function ownLine(locator: Locator, markerLocator: Locator, startsAtMarker: boolean) {
  const [itemBox, markerBox, direction, before] = await Promise.all([
    box(locator),
    box(markerLocator),
    locator.evaluate((element) => getComputedStyle(element).direction),
    pseudoStyle(locator, "::before", ["width", "background-position"]),
  ])
  const boxWidth = px(before.width)
  // The Line is --_toki-flow-marker-half long unless a cap start leaves it the rest of the band.
  const half = markerBox.width / 2
  const width = startsAtMarker ? boxWidth - half : half
  const position = layers(before["background-position"]).at(-1)!.trim()
  const bandStart = direction === "rtl" ? right(itemBox) - boxWidth : itemBox.x
  const left = bandStart + backgroundLeft(position, width, boxWidth)
  return { left, right: left + width, bandStart, bandEnd: bandStart + boxWidth, direction, markerCenter: centerX(markerBox) }
}

test("1. f-fork-join: main Markers sit in column 1 and feature Markers in column 2, one lane gap apart", async ({ page }) => {
  const gap = await laneGap(page, "f-fork-join")
  const main = ["f-fork-join-1", "f-fork-join-5"]
  const feature = ["f-fork-join-2", "f-fork-join-3", "f-fork-join-4"]

  for (const testId of main) {
    const [itemBox, markerBox] = await Promise.all([box(item(page, testId).root), box(item(page, testId).marker)])
    expectNear(centerX(markerBox), itemBox.x + gap / 2, `${testId}: Marker center x in column 1`)
  }
  for (const testId of feature) {
    const [itemBox, markerBox] = await Promise.all([box(item(page, testId).root), box(item(page, testId).marker)])
    expectNear(centerX(markerBox), itemBox.x + gap * 1.5, `${testId}: Marker center x in column 2`)
  }

  const mainBox = await box(item(page, "f-fork-join-1").marker)
  const featureBox = await box(item(page, "f-fork-join-2").marker)
  expectNear(centerX(featureBox) - centerX(mainBox), gap, "the columns are one --toki-lane-gap apart")
})

test("2. every Card lines up in one column outside the Lane band", async ({ page }) => {
  for (const [testId, items] of [
    ["f-fork-join", ["f-fork-join-1", "f-fork-join-2", "f-fork-join-3", "f-fork-join-4", "f-fork-join-5"]],
    ["f-four", ["f-four-1", "f-four-2", "f-four-3", "f-four-4", "f-four-5", "f-four-6", "f-four-7", "f-four-8"]],
  ] as const) {
    const cards = await Promise.all(items.map((id) => box(item(page, id).card)))
    for (const [index, card] of cards.entries()) expectNear(card.x, cards[0]!.x, `${testId} ${items[index]}: Card inline-start x`)
  }
})

test("3. f-four: the Marker centers of columns 1 through 4 are evenly spaced", async ({ page }) => {
  const gap = await laneGap(page, "f-four")
  const ids = ["f-four-1", "f-four-2", "f-four-3", "f-four-4"]
  const centers: number[] = []
  for (const testId of ids) {
    const [itemBox, markerBox] = await Promise.all([box(item(page, testId).root), box(item(page, testId).marker)])
    expectNear(centerX(markerBox), itemBox.x + gap * (ids.indexOf(testId) + 0.5), `${testId}: Marker center x`)
    centers.push(centerX(markerBox))
  }
  for (let index = 1; index < centers.length; index += 1)
    expectNear(centers[index]! - centers[index - 1]!, gap, `columns ${index} and ${index + 1} are one lane gap apart`)
})

test("4. f-start: every Card is on the inline-start side of the Lane band", async ({ page }) => {
  const gap = await laneGap(page, "f-start")
  const band = gap * 2
  const cards: Box[] = []
  for (const testId of ["f-start-1", "f-start-2", "f-start-3", "f-start-4", "f-start-5"]) {
    const [itemBox, markerBox, cardBox] = await Promise.all([
      box(item(page, testId).root),
      box(item(page, testId).marker),
      box(item(page, testId).card),
    ])
    const bandStart = right(itemBox) - band
    expect(right(cardBox), `${testId}: Card inline-end ≤ start of the band`).toBeLessThanOrEqual(bandStart + tolerance)
    expect(centerX(markerBox), `${testId}: Marker is in the band`).toBeGreaterThan(bandStart)
    cards.push(cardBox)
  }
  for (const [index, card] of cards.entries()) expectNear(right(card), right(cards[0]!), `f-start-${index + 1}: Card inline-end`)
})

test("5. f-alternate: Alternate is drawn as Side end, so every Card is on the inline-end side", async ({ page }) => {
  const gap = await laneGap(page, "f-alternate")
  const band = gap * 2
  const cards: Box[] = []
  for (const testId of ["f-alternate-1", "f-alternate-2", "f-alternate-3", "f-alternate-4", "f-alternate-5"]) {
    const [itemBox, cardBox] = await Promise.all([box(item(page, testId).root), box(item(page, testId).card)])
    expect(cardBox.x, `${testId}: Card inline-start ≥ end of the band`).toBeGreaterThanOrEqual(itemBox.x + band - tolerance)
    cards.push(cardBox)
  }
  for (const [index, card] of cards.entries()) expectNear(card.x, cards[0]!.x, `f-alternate-${index + 1}: Card inline-start x`)
})

test("6. f-colors: the Marker of column 2 takes --toki-lane-2-color", async ({ page }) => {
  const marker = item(page, "f-colors-2").marker
  const [laneColor, background] = await Promise.all([
    page.getByTestId("f-colors").evaluate((timeline) => {
      const probe = document.createElement("span")
      probe.style.color = getComputedStyle(timeline).getPropertyValue("--toki-lane-2-color").trim()
      document.body.append(probe)
      const resolved = getComputedStyle(probe).color
      probe.remove()
      return resolved
    }),
    marker.evaluate((element) => getComputedStyle(element).backgroundColor),
  ])

  expect(background).toBe(laneColor)
})

test("7. only the Fork and Join rows have a bend pseudo-element", async ({ page }) => {
  const rows = [
    { id: "f-fork-join-1", fork: false, join: false },
    { id: "f-fork-join-2", fork: true, join: false },
    { id: "f-fork-join-3", fork: false, join: false },
    { id: "f-fork-join-4", fork: false, join: true },
    { id: "f-fork-join-5", fork: false, join: false },
  ]

  for (const { id, fork, join } of rows) {
    const { marker, root } = item(page, id)
    const [forkStyle, joinStyle] = await Promise.all([
      pseudoStyle(marker, "::before", ["content", "border-bottom-width"]),
      pseudoStyle(root, "::after", ["content", "border-top-width"]),
    ])

    if (fork) {
      expect(forkStyle.content, `${id}: Fork bend exists`).not.toBe("none")
      expect(px(forkStyle["border-bottom-width"]), `${id}: Fork bend has a border`).toBeGreaterThan(0)
    } else {
      expect(forkStyle.content, `${id}: no Fork bend`).toBe("none")
    }

    if (join) {
      expect(joinStyle.content, `${id}: Join bend exists`).not.toBe("none")
      expect(px(joinStyle["border-top-width"]), `${id}: Join bend has a border`).toBeGreaterThan(0)
    } else {
      expect(joinStyle.content, `${id}: no Join bend`).toBe("none")
    }
  }
})

test("8. a Join ends the own Lane's Line at the Marker's center", async ({ page }) => {
  for (const testId of ["f-fork-join-4", "f-reuse-3", "f-start-4", "f-alternate-4", "f-plain-3", "f-nested-3"]) {
    const { root, marker } = item(page, testId)
    const [markerBox, size, position] = await Promise.all([
      box(marker),
      pseudoStyle(root, "::before", ["background-size"]),
      pseudoStyle(root, "::before", ["background-position"]),
    ])
    const ownSize = layers(size["background-size"]).at(-1)!.split(" ")
    const ownPosition = layers(position["background-position"]).at(-1)!.split(" ")
    expect(px(ownSize[1]!), `${testId}: the own Line ends at the Marker's center`).toBeLessThanOrEqual(markerBox.height / 2 + tolerance)
    expect(px(ownPosition[1]!), `${testId}: the own Line starts at the top of the row`).toBeLessThanOrEqual(tolerance)
  }
})

test("9. f-plain: every Marker's background is opaque", async ({ page }) => {
  for (const testId of ["f-plain-1", "f-plain-2", "f-plain-3", "f-plain-4"]) {
    const background = await item(page, testId).marker.evaluate((element) => getComputedStyle(element).backgroundColor)
    expect(colorAlpha(background), `${testId}: Marker background ${background} is opaque`).toBe(1)
  }
})

test("10. f-plain: the default --toki-lane-gap is 3rem and every Marker stays inside the Timeline", async ({ page }) => {
  const [timeline, gap, rootSize] = await Promise.all([
    box(page.getByTestId("f-plain")),
    laneGap(page, "f-plain"),
    page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)),
  ])
  expectNear(gap, rootSize * 3, "the default --toki-lane-gap is 3rem")

  for (const testId of ["f-plain-1", "f-plain-2", "f-plain-3", "f-plain-4"]) {
    const markerBox = await box(item(page, testId).marker)
    expect(markerBox.x, `${testId}: Marker inline-start ≥ Timeline inline-start`).toBeGreaterThanOrEqual(timeline.x - tolerance)
  }
})

test("11. f-milestone: the milestone Marker fits its Lane and the Fork's bend is drawn", async ({ page }) => {
  const marker = item(page, "f-milestone-2").marker
  const [markerBox, gap, rootSize, forkStyle] = await Promise.all([
    box(marker),
    laneGap(page, "f-milestone"),
    page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)),
    pseudoStyle(marker, "::before", ["content", "width"]),
  ])

  expect(markerBox.width, "the milestone Marker is at most --toki-lane-gap - 0.5rem wide").toBeLessThanOrEqual(
    gap - rootSize / 2 + tolerance,
  )
  expect(forkStyle.content, "the Fork's bend exists").not.toBe("none")
  expect(px(forkStyle.width), "the Fork's bend has a width to draw").toBeGreaterThan(0)
})

test("12. f-nested: a Flow in a Card does not inherit the row's through Line", async ({ page }) => {
  const inner = page.getByTestId("f-nested-inner-1")
  const through = await inner.evaluate((element) => {
    const style = getComputedStyle(element)
    return ["--_toki-flow-through-1", "--_toki-flow-through-2"].map((name) => style.getPropertyValue(name).trim())
  })

  for (const value of through)
    expect(value === "" || value === "initial", `the inner Item has no through color (got "${value}")`).toBe(true)
})

test("13. fh-fork-join: main Markers sit on Lane row 1 and feature Markers on Lane row 2, one lane gap apart", async ({ page }) => {
  const gap = await laneGap(page, "fh-fork-join")
  const main = ["fh-fork-join-1", "fh-fork-join-5"]
  const feature = ["fh-fork-join-2", "fh-fork-join-3", "fh-fork-join-4"]

  for (const testId of main) {
    const [itemBox, markerBox] = await Promise.all([box(item(page, testId).root), box(item(page, testId).marker)])
    expectNear(centerY(markerBox), itemBox.y + gap / 2, `${testId}: Marker center y on Lane row 1`)
  }
  for (const testId of feature) {
    const [itemBox, markerBox] = await Promise.all([box(item(page, testId).root), box(item(page, testId).marker)])
    expectNear(centerY(markerBox), itemBox.y + gap * 1.5, `${testId}: Marker center y on Lane row 2`)
  }

  const mainBox = await box(item(page, "fh-fork-join-1").marker)
  const featureBox = await box(item(page, "fh-fork-join-2").marker)
  expectNear(centerY(featureBox) - centerY(mainBox), gap, "the Lane rows are one --toki-lane-gap apart")
})

test("14. fh-fork-join: every Card starts on the same row outside the Lane band, and the Items run inline", async ({ page }) => {
  const ids = ["fh-fork-join-1", "fh-fork-join-2", "fh-fork-join-3", "fh-fork-join-4", "fh-fork-join-5"]
  const cards: Box[] = []
  const roots: Box[] = []
  for (const testId of ids) {
    const [root, card, marker] = await Promise.all([
      box(item(page, testId).root),
      box(item(page, testId).card),
      box(item(page, testId).marker),
    ])
    roots.push(root)
    cards.push(card)
    // Side end puts the Card below the band, so its top is below the whole Marker.
    expect(card.y, `${testId}: Card top is below the Marker`).toBeGreaterThan(centerY(marker))
  }

  for (const [index, card] of cards.entries()) expectNear(card.y, cards[0]!.y, `${ids[index]}: Card top y`)
  for (const [index, root] of roots.entries()) {
    if (index === 0) continue
    expect(root.x, `${ids[index]}: Item x`).toBeGreaterThan(roots[index - 1]!.x)
  }
})

test("15. fh-four: the Marker centers of Lane rows 1 through 4 are evenly spaced, and the Items run inline", async ({ page }) => {
  const gap = await laneGap(page, "fh-four")
  const ids = ["fh-four-1", "fh-four-2", "fh-four-3", "fh-four-4"]
  const centers: number[] = []
  for (const testId of ids) {
    const [itemBox, markerBox] = await Promise.all([box(item(page, testId).root), box(item(page, testId).marker)])
    expectNear(centerY(markerBox), itemBox.y + gap * (ids.indexOf(testId) + 0.5), `${testId}: Marker center y`)
    centers.push(centerY(markerBox))
  }
  for (let index = 1; index < centers.length; index += 1)
    expectNear(centers[index]! - centers[index - 1]!, gap, `Lane rows ${index} and ${index + 1} are one lane gap apart`)

  const roots = await Promise.all(ids.map((testId) => box(item(page, testId).root)))
  for (const [index, root] of roots.entries()) {
    if (index === 0) continue
    expect(root.x, `${ids[index]}: Item x`).toBeGreaterThan(roots[index - 1]!.x)
  }
})

test("16. only the Fork and Join rows of fh-fork-join have a bend pseudo-element", async ({ page }) => {
  const rows = [
    { id: "fh-fork-join-1", fork: false, join: false },
    { id: "fh-fork-join-2", fork: true, join: false },
    { id: "fh-fork-join-3", fork: false, join: false },
    { id: "fh-fork-join-4", fork: false, join: true },
    { id: "fh-fork-join-5", fork: false, join: false },
  ]

  for (const { id, fork, join } of rows) {
    const { marker, root } = item(page, id)
    const [forkStyle, joinStyle] = await Promise.all([
      pseudoStyle(marker, "::before", ["content", "border-inline-end-width"]),
      pseudoStyle(root, "::after", ["content", "border-inline-start-width"]),
    ])

    if (fork) {
      expect(forkStyle.content, `${id}: Fork bend exists`).not.toBe("none")
      expect(px(forkStyle["border-inline-end-width"]), `${id}: Fork bend has a border`).toBeGreaterThan(0)
    } else {
      expect(forkStyle.content, `${id}: no Fork bend`).toBe("none")
    }

    if (join) {
      expect(joinStyle.content, `${id}: Join bend exists`).not.toBe("none")
      expect(px(joinStyle["border-inline-start-width"]), `${id}: Join bend has a border`).toBeGreaterThan(0)
    } else {
      expect(joinStyle.content, `${id}: no Join bend`).toBe("none")
    }
  }
})

test("17. fh-collapse: a narrow horizontal Flow lays out as the vertical Flow on Side end", async ({ page }) => {
  const roots: Box[] = []
  for (const n of [1, 2, 3, 4, 5]) {
    const [horizontal, vertical] = await Promise.all([boxes(page, `fh-collapse-${n}`), boxes(page, `f-fork-join-${n}`)])
    roots.push(horizontal.root)
    for (const part of ["marker", "card", "meta"] as const)
      expectNear(
        startOffset(horizontal.root, horizontal[part]),
        startOffset(vertical.root, vertical[part]),
        `fh-collapse-${n}: ${part} inline-start offset is the vertical Flow's`,
      )
    expect(right(horizontal.marker), `${n}: Marker inline-end ≤ Card inline-start`).toBeLessThanOrEqual(horizontal.card.x)
  }

  for (const [index, root] of roots.entries()) {
    if (index === 0) continue
    expectNear(root.x, roots[0]!.x, `fh-collapse-${index + 1}: Item x`)
    expect(root.y, `fh-collapse-${index + 1}: Item y`).toBeGreaterThan(roots[index - 1]!.y)
  }
})

test("18. fh-collapse-start: a narrow horizontal Flow lays out as the vertical Flow on Side start", async ({ page }) => {
  const roots: Box[] = []
  for (const n of [1, 2, 3, 4, 5]) {
    const [horizontal, vertical] = await Promise.all([boxes(page, `fh-collapse-start-${n}`), boxes(page, `f-start-${n}`)])
    roots.push(horizontal.root)
    for (const part of ["marker", "card", "meta"] as const)
      expectNear(
        endOffset(horizontal.root, horizontal[part]),
        endOffset(vertical.root, vertical[part]),
        `fh-collapse-start-${n}: ${part} inline-end offset is the vertical Flow's`,
      )
    expect(right(horizontal.card), `${n}: Card inline-end ≤ Marker inline-start`).toBeLessThanOrEqual(horizontal.marker.x)
    expect(centerX(horizontal.marker), `${n}: Marker is on the inline-end side`).toBeGreaterThan(
      horizontal.root.x + horizontal.root.width / 2,
    )
  }

  for (const [index, root] of roots.entries()) {
    if (index === 0) continue
    expectNear(root.x, roots[0]!.x, `fh-collapse-start-${index + 1}: Item x`)
    expect(root.y, `fh-collapse-start-${index + 1}: Item y`).toBeGreaterThan(roots[index - 1]!.y)
  }
})

test("19. fh-rtl: the own Lane's Line reaches the Marker's center in a right-to-left Flow", async ({ page }) => {
  const rows = [
    { id: "fh-rtl-1", startsAtMarker: true },
    { id: "fh-rtl-2", startsAtMarker: true },
    { id: "fh-rtl-4", startsAtMarker: false },
    { id: "fh-rtl-5", startsAtMarker: false },
  ]

  for (const { id, startsAtMarker } of rows) {
    const { root, marker } = item(page, id)
    const line = await ownLine(root, marker, startsAtMarker)
    expect(line.direction, `${id}: direction`).toBe("rtl")
    const markerSideEdge = startsAtMarker ? line.right : line.left
    const farEdge = startsAtMarker ? line.left : line.right
    expectNear(markerSideEdge, line.markerCenter, `${id}: the own Line's edge is the Marker center`)
    expectNear(farEdge, startsAtMarker ? line.bandStart : line.bandEnd, `${id}: the own Line runs to the band's edge`)
  }
})

test("20. fh-fork-join and fh-alternate: every Meta starts on the Card's row below the Lane band", async ({ page }) => {
  for (const ids of [
    ["fh-fork-join-1", "fh-fork-join-2", "fh-fork-join-3", "fh-fork-join-4", "fh-fork-join-5"],
    ["fh-alternate-1", "fh-alternate-2", "fh-alternate-3", "fh-alternate-4", "fh-alternate-5"],
  ] as const) {
    const tops: number[] = []
    for (const id of ids) {
      const { marker, card, meta } = await boxes(page, id)
      expect(meta.y, `${id}: Meta top is below the Marker`).toBeGreaterThan(centerY(marker))
      expectNear(meta.y, card.y, `${id}: Meta top = Card top`)
      tops.push(meta.y)
    }
    for (const [index, top] of tops.entries()) expectNear(top, tops[0]!, `${ids[index]}: Meta top y`)
  }
})

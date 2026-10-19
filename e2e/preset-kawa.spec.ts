import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// The kawa Preset on site/pages/preset-kawa.html. The Line of a done Item is the Item's own ::before Segment; an
// upcoming Item replaces it with a dashed ::after layer, because a dashed border cannot be moved. Pseudo-elements have
// no box of their own, so the tests read computed styles. The scroll-driven fill is an enhancement, so its tests branch
// on the browser's support the same way e2e/reveal.spec.ts does.

test.use({ viewport: { width: 1400, height: 900 } })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("/pages/preset-kawa.html")
  await page.evaluate(() => document.fonts.ready)
  await frames(page)
})

async function supportsScrollTimeline(page: Page): Promise<boolean> {
  return page.evaluate(() => CSS.supports("animation-timeline: view()"))
}

/** Let scroll-driven animations update before reading styles. */
async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

/** The Item with this data-testid and its parts. */
function item(page: Page, testId: string) {
  const root = page.getByTestId(testId)
  return { root, marker: root.locator(".toki-marker"), card: root.locator(".toki-card") }
}

/** Reads computed properties of one of an element's pseudo-elements. */
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

/** How much of the done Segment is filled: the shorter side of a two-value scale, or 1 when no scale is set. */
function scaleProgress(value: string): number {
  if (value === "none" || value === "") return 1
  return Math.min(...value.split(/\s+/).map((part) => Number.parseFloat(part)))
}

/** How far apart two positions may be and still count as the same. */
const tolerance = 1

/** Asserts that two lengths are the same, allowing the tolerance. */
function expectNear(actual: number, expected: number, what: string): void {
  expect(Math.abs(actual - expected), `${what} (${actual} and ${expected})`).toBeLessThanOrEqual(tolerance)
}

/** Where a Segment and its dash layer start and end along the Line, with the layer's move applied. */
interface Extent {
  /** The end of the Segment (::before) along the Line, in the Item's coordinates. */
  segmentEnd: number
  /** The Segment's length along the Line. */
  segmentSize: number
  /** The dash layer's (::after) start along the Line, before its move. */
  layerStart: number
  /** The dash layer's length along the Line. */
  layerSize: number
  /** How far the layer has moved along the Line at this moment. */
  move: number
  /** The end of the layer as painted after its move. */
  drawnEnd: number
}

/**
 * Reads the Segment and dash layer geometry of an Item. Pseudo-elements have no box of their own, so the geometry comes
 * from their computed styles: a vertical layer is positioned with inset-block, and a horizontal one is a stretched grid
 * item whose length along the Line is its margin plus its used width.
 */
function extentOf(locator: Locator): Promise<Extent> {
  return locator.evaluate((element) => {
    const item = element as HTMLElement
    const before = getComputedStyle(item, "::before")
    const after = getComputedStyle(item, "::after")
    const vertical = after.position === "absolute"

    /** The layer's move along the inline and block axes, with its translate and transform applied. */
    const translation = (style: CSSStyleDeclaration): readonly [number, number] => {
      let x = 0
      let y = 0
      const translate = style.getPropertyValue("translate")
      if (translate !== "none") {
        const parts = translate.split(/\s+/)
        x = Number.parseFloat(parts[0] ?? "0")
        y = Number.parseFloat(parts[1] ?? "0")
      }
      const transform = style.getPropertyValue("transform")
      if (transform !== "none") {
        const matrix = new DOMMatrixReadOnly(transform)
        x += matrix.m41
        y += matrix.m42
      }
      return [x, y]
    }

    const [moveX, moveY] = translation(after)
    if (vertical) {
      const segmentSize = Number.parseFloat(before.height)
      const layerStart = Number.parseFloat(after.top)
      const layerSize = Number.parseFloat(after.height)
      return {
        segmentEnd: Number.parseFloat(before.top) + segmentSize,
        segmentSize,
        layerStart,
        layerSize,
        move: moveY,
        drawnEnd: layerStart + layerSize + moveY,
      }
    }
    const segmentSize = Number.parseFloat(before.width)
    const layerStart = Number.parseFloat(after.getPropertyValue("margin-inline-start"))
    const layerSize = Number.parseFloat(after.width)
    return {
      segmentEnd: Number.parseFloat(before.getPropertyValue("margin-inline-start")) + segmentSize,
      segmentSize,
      layerStart,
      layerSize,
      move: moveX,
      drawnEnd: layerStart + layerSize + moveX,
    }
  })
}

/** Pauses the Item's dash animation half a period into its loop, where the layer is in the middle of a move. */
async function pauseMidMove(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).evaluate((element) => {
    const duration = Number.parseFloat(getComputedStyle(element, "::after").animationDuration) * 1000
    const onItem = document.getAnimations().filter((candidate) => {
      const effect = candidate.effect as KeyframeEffect | null
      return effect?.target === element
    })
    const animation =
      onItem.find((candidate) => (candidate.effect as KeyframeEffect | null)?.pseudoElement === "::after") ??
      onItem[0] ??
      element.getAnimations()[0]
    if (!animation) throw new Error("the Item has no dash animation")
    animation.pause()
    animation.currentTime = duration / 2
  })
  await frames(page)
}

/** Asserts that the dash layer paints no further than the Segment's end along the Line. */
async function expectEndsAtSegment(page: Page, testId: string, what: string): Promise<void> {
  const reading = await extentOf(item(page, testId).root)
  expect(
    reading.drawnEnd,
    `${what}: the dashes end at the Segment's end (${reading.drawnEnd} and ${reading.segmentEnd})`,
  ).toBeLessThanOrEqual(reading.segmentEnd + tolerance)
}

/** Asserts that the Item itself is not clipped: a clip would cut the Card's shadow and a focus ring on its edge. */
async function expectNoClip(page: Page, testId: string, what: string): Promise<void> {
  const clip = await item(page, testId).root.evaluate((element) => getComputedStyle(element).getPropertyValue("clip-path"))
  expect(clip, `${what}: the Item is not clipped`).toBe("none")
}

test("1. an upcoming Segment is a dashed layer that moves along the Line", async ({ page }) => {
  const vertical = await pseudoStyle(item(page, "kawa-vertical-5").root, "::after", [
    "content",
    "animation-name",
    "animation-duration",
    "animation-iteration-count",
    "background-image",
  ])
  expect(vertical.content).toBe('""')
  expect(vertical["background-image"], "vertical: a repeating gradient draws the dashes").toContain("repeating-linear-gradient")
  expect(vertical["animation-name"], "vertical: the dashes move").not.toBe("none")
  expect(vertical["animation-duration"]).toBe("2.4s")
  expect(vertical["animation-iteration-count"]).toBe("infinite")

  const horizontal = await pseudoStyle(item(page, "kawa-horizontal-5").root, "::after", ["animation-name", "background-image"])
  expect(horizontal["background-image"], "horizontal: a repeating gradient draws the dashes").toContain("repeating-linear-gradient")
  expect(horizontal["animation-name"], "horizontal: the dashes move").not.toBe("none")
  expect(horizontal["animation-name"], "the movement follows the Orientation").not.toBe(vertical["animation-name"])
})

test("2. a done Segment is a solid accent line, unlike the dashes of an upcoming one", async ({ page }) => {
  const accent = await item(page, "kawa-vertical-1").marker.evaluate((marker) => getComputedStyle(marker).backgroundColor)
  const verticalDone = await pseudoStyle(item(page, "kawa-vertical-1").root, "::before", ["border-left-style", "border-left-color"])
  const verticalDash = await pseudoStyle(item(page, "kawa-vertical-5").root, "::after", ["color"])
  const verticalUpcoming = await pseudoStyle(item(page, "kawa-vertical-5").root, "::before", ["border-left-color"])

  expect(verticalDone["border-left-style"]).toBe("solid")
  expect(verticalDone["border-left-color"], "done: the Segment uses the accent").toBe(accent)
  expect(verticalUpcoming["border-left-color"], "upcoming: the Segment itself is not painted").toMatch(
    /^(?:rgba\(0, 0, 0, 0\)|transparent)$/,
  )
  expect(verticalDash.color, "the moving dashes differ from the done line").not.toBe(verticalDone["border-left-color"])

  const horizontalDone = await pseudoStyle(item(page, "kawa-horizontal-1").root, "::before", ["border-top-style", "border-top-color"])
  const horizontalDash = await pseudoStyle(item(page, "kawa-horizontal-5").root, "::after", ["color"])
  expect(horizontalDone["border-top-style"]).toBe("solid")
  expect(horizontalDone["border-top-color"], "horizontal done: the Segment uses the accent").toBe(accent)
  expect(horizontalDash.color).not.toBe(horizontalDone["border-top-color"])
})

test("3. the done line grows with scroll where supported, and is full without support", async ({ page }) => {
  const supported = await supportsScrollTimeline(page)
  const before = await pseudoStyle(item(page, "kawa-vertical-1").root, "::before", [
    "animation-name",
    "animation-timeline",
    "scale",
    "transform",
  ])

  if (!supported) {
    expect(before["animation-name"], "Firefox: no scroll-driven animation").toBe("none")
    expect(before.transform, "Firefox: the line is fully painted").toBe("none")
    expect(scaleProgress(before.scale), "Firefox: the line is fully painted").toBe(1)
    return
  }

  expect(before["animation-name"], "the scroll-driven fill runs").toContain("toki-kawa-grow")
  expect(before["animation-timeline"], "the fill follows a view timeline").not.toBe("auto")
  // The page starts with a tall gap, so the first done Segment is still below the viewport and has not grown.
  expect(scaleProgress(before.scale), "at the top of the page the done line is not yet full").toBeLessThan(1)

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }))
  await frames(page)
  const after = await pseudoStyle(item(page, "kawa-vertical-1").root, "::before", ["scale"])
  expect(scaleProgress(after.scale), "after reading past it the done line is full").toBeGreaterThanOrEqual(0.99)
})

test("4. reduced motion stops every animation and leaves the done line full", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await frames(page)

  for (const timeline of ["kawa-vertical", "kawa-horizontal", "kawa-dark-timeline"]) {
    const names = await page
      .getByTestId(timeline)
      .evaluate((root) =>
        Array.from(root.querySelectorAll(".toki-item")).flatMap((item) => [
          getComputedStyle(item, "::before").animationName,
          getComputedStyle(item, "::after").animationName,
        ]),
      )
    expect(names.length).toBeGreaterThan(0)
    expect(names, `${timeline}: every animation-name is none`).toEqual(names.map(() => "none"))
  }

  const done = await pseudoStyle(item(page, "kawa-vertical-1").root, "::before", ["transform", "scale"])
  expect(done.transform, "reduced motion: the done line is fully painted").toBe("none")
  expect(scaleProgress(done.scale), "reduced motion: the done line is fully painted").toBe(1)
})

test("5. a Timeline without data-preset keeps the default look", async ({ page }) => {
  const timeline = page.getByTestId("kawa-none")
  const custom = await timeline.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      accent: style.getPropertyValue("--toki-accent").trim(),
      line: style.getPropertyValue("--toki-line-color").trim(),
    }
  })
  expect(custom.accent, "kawa-none does not inherit the Preset accent").toBe("")
  expect(custom.line, "kawa-none does not inherit the Preset line color").toBe("")

  const upcoming = await pseudoStyle(item(page, "kawa-none-3").root, "::before", ["border-left-style"])
  expect(upcoming["border-left-style"], "kawa-none keeps the default dashed Segment").toBe("dashed")

  const dashLayer = await pseudoStyle(item(page, "kawa-none-3").root, "::after", ["content", "animation-name", "background-image"])
  expect(dashLayer.content, "kawa-none has no Preset dash layer").toBe("none")
  expect(dashLayer["animation-name"]).toBe("none")
  expect(dashLayer["background-image"]).toBe("none")

  const accent = await item(page, "kawa-vertical-1").marker.evaluate((marker) => getComputedStyle(marker).backgroundColor)
  const noneLine = await pseudoStyle(item(page, "kawa-none-1").root, "::before", ["border-left-color"])
  expect(noneLine["border-left-color"], "kawa-none keeps the default line color").not.toBe(accent)

  const noneCard = await item(page, "kawa-none-1").card.evaluate((card) => getComputedStyle(card).backgroundColor)
  const kawaCard = await item(page, "kawa-vertical-1").card.evaluate((card) => getComputedStyle(card).backgroundColor)
  expect(noneCard, "kawa-none keeps the default Card background").not.toBe(kawaCard)
})

test("6. the last upcoming Segment ends where the Line ends, in the middle of a move too", async ({ page }) => {
  // The layer is still a period longer at its start; the last Item pulls its end back to where its Segment ends.
  await page.emulateMedia({ reducedMotion: "reduce" })
  await frames(page)
  await expectNoClip(page, "kawa-vertical-6", "vertical, reduced motion")
  await expectEndsAtSegment(page, "kawa-vertical-6", "vertical, reduced motion")
  await expectEndsAtSegment(page, "kawa-horizontal-6", "horizontal, reduced motion")

  await page.emulateMedia({ reducedMotion: "no-preference" })
  await frames(page)
  await pauseMidMove(page, "kawa-vertical-6")
  await expectEndsAtSegment(page, "kawa-vertical-6", "vertical, middle of a move")
  await pauseMidMove(page, "kawa-horizontal-6")
  await expectEndsAtSegment(page, "kawa-horizontal-6", "horizontal, middle of a move")

  // A horizontal Timeline that Collapsed to vertical lays its Items out like the vertical one, so the same rule applies.
  await page.getByTestId("kawa-horizontal").evaluate((timeline) => {
    const horizontal = timeline as HTMLElement
    horizontal.setAttribute("data-collapse", "md")
    horizontal.style.inlineSize = "30rem"
  })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await frames(page)
  await expectNoClip(page, "kawa-horizontal-6", "collapsed horizontal, reduced motion")
  await expectEndsAtSegment(page, "kawa-horizontal-6", "collapsed horizontal, reduced motion")

  await page.emulateMedia({ reducedMotion: "no-preference" })
  await frames(page)
  await pauseMidMove(page, "kawa-horizontal-6")
  await expectEndsAtSegment(page, "kawa-horizontal-6", "collapsed horizontal, middle of a move")
})

test("7. an upcoming Item before the last keeps the period-long layer that moves", async ({ page }) => {
  const period = await item(page, "kawa-vertical-5").root.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).getPropertyValue("--_kawa-dash-period")),
  )
  expect(period, "the dash period").toBeGreaterThan(0)

  await pauseMidMove(page, "kawa-vertical-5")
  const vertical = await extentOf(item(page, "kawa-vertical-5").root)
  expectNear(vertical.layerStart, -period, "vertical: the layer starts a period before the Segment")
  expectNear(vertical.layerSize - vertical.segmentSize, 2 * period, "vertical: the layer is a period longer at each end")
  expectNear(vertical.move, -period / 2, "vertical: the layer is half a period into its move")

  await pauseMidMove(page, "kawa-horizontal-5")
  const horizontal = await extentOf(item(page, "kawa-horizontal-5").root)
  expectNear(horizontal.layerStart, -period, "horizontal: the layer starts a period before the Segment")
  expectNear(horizontal.layerSize - horizontal.segmentSize, 2 * period, "horizontal: the layer is a period longer at each end")
  expectNear(horizontal.move, -period / 2, "horizontal: the layer is half a period into its move")
})

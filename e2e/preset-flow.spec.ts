import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

// The three Presets on site/pages/preset-flow.html. A Flow draws its Lane Lines and its Fork and Join bends through the
// same pseudo-elements that the Presets use for their motion, so every Preset must leave those pseudo-elements to the
// Flow. The tests read computed styles, never screenshots: the baseline images belong to the designer.

/** The properties a Preset must not add to a Flow's pseudo-elements. Colors are dropped before they are compared. */
const properties = [
  "content",
  "position",
  "inset-block-start",
  "inset-inline-start",
  "inline-size",
  "block-size",
  "background-image",
  "background-size",
  "background-position",
  "transform",
  "translate",
  "scale",
  "border-block-start-width",
  "border-block-end-width",
  "border-inline-start-width",
  "border-inline-end-width",
] as const

type Styles = Record<string, string>

interface ItemReading {
  before: Styles
  after: Styles
  markerBefore: Styles
}

/** Every color function a computed value may hold. The value is the Preset's look, so the comparison drops it. */
const colorFunction = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\([^()]*(?:\([^()]*\)[^()]*)*\)/gi

function withoutColors(value: string): string {
  return value.replace(colorFunction, "color")
}

test.use({ viewport: { width: 1400, height: 1000 } })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("/pages/preset-flow.html")
  await page.evaluate(() => document.fonts.ready)
})

/** Lets animations settle before their computed styles are read. */
async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

/** Every Item of the Flow with this data-testid: its two pseudo-elements and its Marker's ::before. */
async function readFlow(page: Page, testId: string): Promise<ItemReading[]> {
  const readings = await page.getByTestId(testId).evaluate((timeline, names) => {
    const read = (element: Element, pseudo: "::before" | "::after"): Styles => {
      const style = getComputedStyle(element, pseudo)
      const styles: Styles = {}
      for (const name of names) styles[name] = style.getPropertyValue(name)
      return styles
    }
    return Array.from(timeline.querySelectorAll(":scope > .toki-item")).map((item) => {
      const marker = item.querySelector(":scope > .toki-marker")
      if (!marker) throw new Error("the Item has no Marker")
      return { before: read(item, "::before"), after: read(item, "::after"), markerBefore: read(marker, "::before") }
    })
  }, properties)
  return readings.map(withoutColorsIn)
}

function withoutColorsIn(reading: ItemReading): ItemReading {
  const clean = (styles: Styles): Styles => Object.fromEntries(Object.entries(styles).map(([name, value]) => [name, withoutColors(value)]))
  return { before: clean(reading.before), after: clean(reading.after), markerBefore: clean(reading.markerBefore) }
}

/** Asserts that every Item of the Preset's Flow draws the same pseudo-elements as the baseline. */
async function expectSameAsBaseline(page: Page, testId: string, baseline: readonly ItemReading[]): Promise<void> {
  const actual = await readFlow(page, testId)
  expect(actual.length, `${testId}: the same number of Items as pf-none`).toBe(baseline.length)
  for (const [index, reading] of actual.entries()) expect(reading, `${testId} Item ${index + 1}`).toEqual(baseline[index])
}

/** Gives the baseline the same done Line width that kawa asks for, so only that intended look differs there. */
async function widenDoneLines(page: Page): Promise<void> {
  await page.getByTestId("pf-none").evaluate((timeline) => {
    for (const item of Array.from(timeline.querySelectorAll(":scope > .toki-item[data-status='done']")))
      (item as HTMLElement).style.setProperty("--toki-line-width", "3px")
  })
}

test("1. under reduced motion, every Preset leaves a Flow's pseudo-elements to the Flow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await frames(page)

  const baseline = await readFlow(page, "pf-none")
  for (const preset of ["hotaru", "kinen"] as const) await expectSameAsBaseline(page, `pf-${preset}`, baseline)

  // kawa keeps its thicker done Line in a Flow, and flow.css sizes that Line from --toki-line-width. The same width on
  // the baseline's done Items lets the rest of the comparison stay exact.
  await widenDoneLines(page)
  await expectSameAsBaseline(page, "pf-kawa", await readFlow(page, "pf-none"))
})

test("2. no Preset animates an Item's pseudo-elements inside a Flow", async ({ page }) => {
  await frames(page)
  for (const preset of ["hotaru", "kawa", "kinen"] as const) {
    const names = await page
      .getByTestId(`pf-${preset}`)
      .evaluate((timeline) =>
        Array.from(timeline.querySelectorAll(":scope > .toki-item")).flatMap((item) => [
          getComputedStyle(item, "::before").animationName,
          getComputedStyle(item, "::after").animationName,
        ]),
      )
    expect(names.length).toBeGreaterThan(0)
    expect(names, `${preset}: every Item pseudo-element has animation-name none`).toEqual(names.map(() => "none"))
  }
})

test("3. hotaru keeps the current Marker's ripple in a Flow", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", "the ripple is checked in Chromium and WebKit")
  await frames(page)

  const name = await page
    .getByTestId("pf-hotaru-3")
    .locator(":scope > .toki-marker")
    .evaluate((marker) => getComputedStyle(marker, "::after").animationName)
  expect(name).toContain("toki-hotaru-ripple")
})

test("4. kawa keeps its done Line's width in a Flow", async ({ page }) => {
  const widths = await page.getByTestId("pf-kawa").evaluate((timeline) =>
    Array.from(timeline.querySelectorAll(":scope > .toki-item")).map((item) => ({
      status: item.getAttribute("data-status"),
      width: getComputedStyle(item).getPropertyValue("--toki-line-width").trim(),
    })),
  )

  expect(widths.length).toBeGreaterThan(0)
  for (const [index, { status, width }] of widths.entries())
    expect(width, `pf-kawa Item ${index + 1} (${status ?? "no Status"})`).toBe(status === "done" ? "3px" : "")
})

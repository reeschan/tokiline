import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("/pages/reveal.html")
  await page.evaluate(() => document.fonts.ready)
  await frames(page)
})

async function supportsReveal(page: Page): Promise<boolean> {
  return page.evaluate(() => CSS.supports("animation-timeline: view()"))
}

/** Let scroll-driven animations update before reading styles or positions. */
async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

async function opacity(part: Locator): Promise<number> {
  return part.evaluate((part) => Number(getComputedStyle(part).opacity))
}

async function expectOpaque(parts: Locator): Promise<void> {
  const values = await parts.evaluateAll((parts) => parts.map((part) => getComputedStyle(part).opacity))
  expect(values.length).toBeGreaterThan(0)
  expect(values).toEqual(values.map(() => "1"))
}

async function centerItem(page: Page, item: Locator): Promise<void> {
  await item.evaluate((item) => item.scrollIntoView({ block: "center", behavior: "instant" }))
  await frames(page)
}

test("1. Reveal starts transparent only when scroll-driven animations are supported", async ({ page }) => {
  const supported = await supportsReveal(page)
  if (supported) {
    expect(await opacity(page.getByTestId("reveal-8").locator(".toki-card"))).toBeLessThan(1)
  } else {
    await expectOpaque(page.getByTestId("reveal").locator(".toki-card, .toki-marker, .toki-meta"))
  }
})

test("2. an Item scrolled into view has opaque Card, Marker and Meta", async ({ page }) => {
  await supportsReveal(page)
  const item = page.getByTestId("reveal-8")
  await centerItem(page, item)
  await expectOpaque(item.locator(".toki-card, .toki-marker, .toki-meta"))
})

test("3. passed Items and the final Card stay opaque at the bottom of the page", async ({ page }) => {
  await supportsReveal(page)
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }))
  await frames(page)
  await expectOpaque(page.getByTestId("reveal-1").locator(".toki-card"))
  await expectOpaque(page.getByTestId("reveal-8").locator(".toki-card"))
  await expectOpaque(page.getByTestId("plain").locator(".toki-item").last().locator(".toki-card"))
})

test("4. reduced motion leaves the offscreen Card opaque", async ({ page }) => {
  await supportsReveal(page)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await frames(page)
  await expectOpaque(page.getByTestId("reveal-8").locator(".toki-card"))
})

test("5. a Timeline without Reveal leaves offscreen Cards opaque", async ({ page }) => {
  await supportsReveal(page)
  await expectOpaque(page.getByTestId("plain").locator(".toki-card"))
})

test("6. an appended Item reveals without initialization", async ({ page }) => {
  const supported = await supportsReveal(page)
  await page.getByTestId("reveal").evaluate((timeline) => {
    const item = document.createElement("li")
    item.className = "toki-item"
    item.dataset["testid"] = "reveal-added"
    item.innerHTML = '<div class="toki-marker"></div><div class="toki-meta">Added later</div><div class="toki-card">New Item</div>'
    timeline.append(item)
  })
  await frames(page)
  const item = page.getByTestId("reveal-added")
  const card = item.locator(".toki-card")
  if (supported) expect(await opacity(card)).toBeLessThan(1)
  else await expectOpaque(card)
  await centerItem(page, item)
  await expectOpaque(card)
})

test("7. the Card enters from its end Side", async ({ page }) => {
  const supported = await supportsReveal(page)
  const item = page.getByTestId("reveal-8")
  const card = item.locator(".toki-card")
  await item.evaluate((item) => {
    window.scrollTo({ top: window.scrollY + item.getBoundingClientRect().top - window.innerHeight + 8, behavior: "instant" })
  })
  await frames(page)
  const entering = await card.evaluate((card) => card.getBoundingClientRect().left)
  await centerItem(page, item)
  const final = await card.evaluate((card) => card.getBoundingClientRect().left)
  if (supported) expect(entering).toBeGreaterThan(final)
  else expect(Math.abs(entering - final)).toBeLessThanOrEqual(1)
})

async function centerTimeline(page: Page, timeline: Locator): Promise<void> {
  await timeline.evaluate((timeline) => timeline.scrollIntoView({ block: "center", behavior: "instant" }))
  await frames(page)
}

async function scrollTimelineToEnd(page: Page, timeline: Locator): Promise<void> {
  await timeline.evaluate((timeline) => timeline.scrollTo({ left: timeline.scrollWidth, behavior: "instant" }))
  await frames(page)
}

test("8. the horizontal Reveal follows the Timeline's own inline scroll", async ({ page }) => {
  const supported = await supportsReveal(page)
  const timeline = page.getByTestId("h-reveal")
  const card = page.getByTestId("h-reveal-8").locator(".toki-card")
  await centerTimeline(page, timeline)
  if (supported) expect(await opacity(card)).toBeLessThan(1)
  else await expectOpaque(card)
  await scrollTimelineToEnd(page, timeline)
  await expectOpaque(card)
})

test("9. a horizontal Card slides in from its Side, not inline", async ({ page }) => {
  const supported = await supportsReveal(page)
  if (!supported) return
  const vertical = await page
    .getByTestId("reveal-8")
    .locator(".toki-card")
    .evaluate((card) => getComputedStyle(card).animationName)
  const horizontal = await page
    .getByTestId("h-reveal-8")
    .locator(".toki-card")
    .evaluate((card) => getComputedStyle(card).animationName)
  expect(vertical).toBe("toki-reveal-slide")
  expect(horizontal).not.toBe(vertical)
})

test("10. Firefox and reduced motion leave every horizontal Card opaque", async ({ page }) => {
  const supported = await supportsReveal(page)
  const timeline = page.getByTestId("h-reveal")
  await centerTimeline(page, timeline)
  if (!supported) await expectOpaque(timeline.locator(".toki-card"))
  await page.emulateMedia({ reducedMotion: "reduce" })
  await frames(page)
  await expectOpaque(timeline.locator(".toki-card"))
})

test("11. the horizontal Reveal has finished for the Items in the initial view", async ({ page }) => {
  // axe measures contrast on every Item whose opacity is not 0, including one that is only partly inside the
  // Timeline's inline scrollport and is therefore mid-Reveal. The fixture is 35rem wide: the first two 16rem Items
  // and their 2rem gap fit inside it, so their Reveal has finished, while the third Item starts at 36rem, wholly
  // outside. That geometry keeps the initial state free of the translucent, partly visible Item that made axe fail;
  // the Reveal rule itself is unchanged. This test guards that geometry.
  const supported = await supportsReveal(page)
  const timeline = page.getByTestId("h-reveal")
  await timeline.evaluate((timeline) => timeline.scrollTo({ left: 0, behavior: "instant" }))
  await centerTimeline(page, timeline)

  const first = page.getByTestId("h-reveal-1")
  const second = page.getByTestId("h-reveal-2")
  const third = page.getByTestId("h-reveal-3")
  await expectOpaque(first.locator(".toki-card, .toki-marker, .toki-meta"))
  await expectOpaque(second.locator(".toki-card, .toki-marker, .toki-meta"))

  const [timelineBox, thirdBox] = await Promise.all([timeline.boundingBox(), third.boundingBox()])
  if (!timelineBox || !thirdBox) throw new Error("the horizontal Timeline and its third Item must have a box")
  expect(thirdBox.x).toBeGreaterThanOrEqual(timelineBox.x + timelineBox.width)
  if (supported) expect(await opacity(third.locator(".toki-meta"))).toBe(0)
})

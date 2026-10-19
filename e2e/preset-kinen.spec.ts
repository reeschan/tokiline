import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

// Preset kinen on site/pages/preset-kinen.html. The checks read computed styles and positions, never screenshots: the
// gold edge is a background gradient on the current Card (animated through a registered custom property), the sheen is
// a pseudo-element of the current Meta, and the lifted Card moves through its `translate`.

interface Box {
  x: number
  y: number
  width: number
  height: number
}

const tolerance = 1

test.use({ viewport: { width: 1400, height: 1000 } })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("/pages/preset-kinen.html")
  await page.evaluate(() => document.fonts.ready)
})

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox()
  if (!found) throw new Error("the element has no bounding box")
  return found
}

const centerY = (b: Box) => b.y + b.height / 2
const right = (b: Box) => b.x + b.width

/** A Card's computed animation-name and its ::after animation-name. */
function cardAnimations(card: Locator): Promise<{ card: string; after: string }> {
  return card.evaluate((card) => ({
    card: getComputedStyle(card).animationName,
    after: getComputedStyle(card, "::after").animationName,
  }))
}

/** A Card's computed translate. */
async function translate(card: Locator): Promise<string> {
  return card.evaluate((card) => getComputedStyle(card).translate)
}

test("1. only the current Card has the turning gold edge and the sheen", async ({ page }) => {
  const current = page.getByTestId("kinen-vertical-current").locator(".toki-card")
  const done = page.getByTestId("kinen-vertical-1").locator(".toki-card")

  expect((await cardAnimations(current)).card).toContain("toki-kinen-ring")
  expect(await current.evaluate((card) => getComputedStyle(card).backgroundImage)).toContain("conic-gradient")

  expect((await cardAnimations(current)).after).toBe("none")
  expect((await cardAnimations(done)).card).toBe("none")
  expect((await cardAnimations(done)).after).toBe("none")
  expect(await done.evaluate((card) => getComputedStyle(card).backgroundImage)).not.toContain("conic-gradient")

  const currentMeta = page.getByTestId("kinen-vertical-current").locator(".toki-meta")
  const doneMeta = page.getByTestId("kinen-vertical-1").locator(".toki-meta")
  expect(await currentMeta.evaluate((meta) => getComputedStyle(meta, "::after").animationName)).toContain("toki-kinen-sheen")
  expect(await doneMeta.evaluate((meta) => getComputedStyle(meta, "::after").animationName)).toBe("none")
})

test("2. a Card lifts on hover and its shadow layer turns opaque", async ({ page }) => {
  const card = page.getByTestId("kinen-vertical-current").locator(".toki-card")
  const resting = await translate(card)
  expect(resting).toBe("none")

  await card.hover()
  await expect.poll(() => translate(card), { message: "the hovered Card moves" }).not.toBe(resting)
  await expect.poll(() => card.evaluate((card) => getComputedStyle(card, "::after").opacity)).toBe("1")
})

test("3. a focused link lifts the Card the same way", async ({ page }) => {
  const card = page.getByTestId("kinen-vertical-current").locator(".toki-card")
  const link = card.getByRole("link")
  const resting = await translate(card)

  await link.focus()
  await expect(link).toBeFocused()
  await expect.poll(() => translate(card), { message: "the Card around the focused link moves" }).not.toBe(resting)
})

test("4. reduced motion stops every animation and every lift, while the edge stays", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })

  const names = await page.locator("[data-preset='kinen']").evaluateAll((timelines) =>
    timelines.flatMap((timeline) =>
      Array.from(timeline.querySelectorAll("*")).flatMap((element) => {
        const style = getComputedStyle(element)
        return [
          style.animationName,
          getComputedStyle(element, "::before").animationName,
          getComputedStyle(element, "::after").animationName,
        ]
      }),
    ),
  )
  expect(names.length).toBeGreaterThan(0)
  expect(new Set(names)).toEqual(new Set(["none"]))

  const card = page.getByTestId("kinen-vertical-current").locator(".toki-card")
  expect(await card.evaluate((card) => getComputedStyle(card).backgroundImage)).toContain("conic-gradient")
  const resting = await translate(card)
  await card.hover()
  expect(await translate(card)).toBe(resting)
})

test("5. a Timeline without data-preset keeps the default computed style", async ({ page }) => {
  const read = (item: Locator) =>
    item.evaluate((element) => {
      const card = element.matches(".toki-card") ? element : element.querySelector(".toki-card")
      const timeline = element.closest(".toki-timeline")
      if (!(card instanceof Element) || !(timeline instanceof Element)) throw new Error("the Card or Timeline is missing")
      const cardStyle = getComputedStyle(card)
      const afterStyle = getComputedStyle(card, "::after")
      return {
        accent: getComputedStyle(timeline).getPropertyValue("--toki-accent").trim(),
        backgroundImage: cardStyle.backgroundImage,
        backgroundColor: cardStyle.backgroundColor,
        borderColor: cardStyle.borderColor,
        boxShadow: cardStyle.boxShadow,
        translate: cardStyle.translate,
        animationName: cardStyle.animationName,
        afterContent: afterStyle.content,
        afterAnimationName: afterStyle.animationName,
      }
    })

  const withoutPreset = await read(page.getByTestId("kinen-none-1"))

  await page.goto("/pages/theming.html")
  const withDefaultStyle = await read(page.getByTestId("segments-1"))

  expect(withoutPreset).toEqual(withDefaultStyle)
})

test("6. the horizontal Timeline keeps its Items in a row with no block overflow", async ({ page }) => {
  const ids = [1, 2, 3, 4, 5].map((n) =>
    page.getByTestId(n === 2 ? "kinen-horizontal-current" : n === 3 ? "kinen-horizontal-milestone" : `kinen-horizontal-${n}`),
  )
  const [roots, markers] = await Promise.all([
    Promise.all(ids.map((item) => box(item))),
    Promise.all(ids.map((item) => box(item.locator(".toki-marker")))),
  ])

  for (const [index, marker] of markers.entries()) {
    expect(Math.abs(centerY(marker) - centerY(markers[0]!)), `kinen-horizontal-${index + 1}: Marker center y`).toBeLessThanOrEqual(
      tolerance,
    )
  }
  for (const [index, root] of roots.entries()) {
    if (index > 0) expect(root.x, `kinen-horizontal-${index + 1}: Item x`).toBeGreaterThan(roots[index - 1]!.x)
  }
  expect(right(roots[0]!)).toBeLessThan(roots[1]!.x)

  const metrics = await page.getByTestId("kinen-horizontal").evaluate((timeline) => ({
    scrollWidth: timeline.scrollWidth,
    clientWidth: timeline.clientWidth,
    scrollHeight: timeline.scrollHeight,
    clientHeight: timeline.clientHeight,
  }))
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + tolerance)
})

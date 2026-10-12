import { expect, test } from "@playwright/test"
import type { Locator } from "@playwright/test"

// A Marker that holds plain text (the number of a step) with no element around it, on site/pages/marker-text.html. The
// Marker's own color must stay as it is, because its default background is currentColor, so the text takes its color
// from -webkit-text-fill-color instead.

interface MarkerText {
  fill: string
  background: string
  /** How far the center of the text is from the center of the Marker, across and along the page. */
  offsetX: number
  offsetY: number
}

/** How far apart the centers may be and still count as centered. */
const centerTolerance = 2

/** The text fill, the background and the text's offset from the center of the Marker with this data-testid. */
function measure(item: Locator): Promise<MarkerText> {
  return item.locator(".toki-marker").evaluate((marker) => {
    const style = getComputedStyle(marker)
    const range = document.createRange()
    range.selectNodeContents(marker)
    const text = range.getBoundingClientRect()
    const box = marker.getBoundingClientRect()
    return {
      fill: style.getPropertyValue("-webkit-text-fill-color"),
      background: style.backgroundColor,
      offsetX: text.x + text.width / 2 - (box.x + box.width / 2),
      offsetY: text.y + text.height / 2 - (box.y + box.height / 2),
    }
  })
}

test("plain text in a Marker is readable and centered", async ({ page }) => {
  await page.goto("/pages/marker-text.html")
  const light = await measure(page.getByTestId("numbers-1"))
  const dark = await measure(page.getByTestId("numbers-dark-1"))

  expect(light.fill, "the text fill differs from the Marker's background in the light page").not.toBe(light.background)
  expect(dark.fill, "the text fill differs from the Marker's background in the dark page").not.toBe(dark.background)
  expect(light.fill, "the text fill is Canvas").toBe("rgb(255, 255, 255)")
  expect(Math.abs(light.offsetX), "the text is centered across").toBeLessThanOrEqual(centerTolerance)
  expect(Math.abs(light.offsetY), "the text is centered along").toBeLessThanOrEqual(centerTolerance)
})

import { expect, test } from "@playwright/test"

test("the demo page opens and shows a Timeline without console errors", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto("/")

  await expect(page).toHaveTitle(/tokiline/)
  expect(await page.locator(".toki-timeline").count()).toBeGreaterThanOrEqual(1)
  expect(errors).toEqual([])
})

import { expect, test } from "@playwright/test"

// Fixes from the first round of PI feedback (2026-11-09).

test("a new section opens at the top of the pane", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("./?ref=A&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  const main = page.locator("main")
  await main.evaluate((el) => (el.scrollTop = el.scrollHeight))
  await page.getByRole("button", { name: /Continue to/ }).click()
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Cranium · Morphological")
  await page.waitForTimeout(200)
  expect(await main.evaluate((el) => el.scrollTop)).toBe(0)
})

test("Help brings the intro card back", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?ref=A&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click()
  await expect(page.getByRole("button", { name: "Got it" })).toHaveCount(0)
  await page.getByRole("button", { name: /Help/ }).click()
  await page.getByRole("menuitem", { name: "How scoring works" }).click()
  await expect(page.getByRole("button", { name: "Got it" })).toBeVisible()
  await expect(page.getByText(/typing its number/)).toBeVisible()
  await page.screenshot({ path: "e2e/.shots/feedback-intro.png" })
})

test("a click in the docked reference hands the keys back to the field", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&refon=1&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click()
  const panel = page.getByRole("complementary", { name: "Reference" })
  const name = await panel.locator("span.text-base").first().textContent()
  // Click plain text in the panel, then use the keys.
  await panel.locator("p.text-sm").first().click()
  await expect(page.locator("main :focus")).toHaveCount(1)
  await page.keyboard.press("ArrowDown")
  await expect(panel.locator("span.text-base").first()).not.toHaveText(name!)
  // Closing the panel with its own button leaves the keys working too.
  await panel.getByRole("button", { name: /close/i }).click()
  await expect(panel).toHaveCount(0)
  await expect(page.locator("main :focus")).toHaveCount(1)
  await page.keyboard.press("r")
  await expect(page.getByRole("complementary", { name: "Reference" })).toBeVisible()
})

test("the docked reference resizes by its edge and keeps the width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&refon=1&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click()
  const panel = page.getByRole("complementary", { name: "Reference" })
  const before = (await panel.boundingBox())!
  expect(Math.round(before.width)).toBe(360)
  const edge = (await page.getByTestId("reference-resize").boundingBox())!
  await page.mouse.move(edge.x + edge.width / 2, edge.y + 200)
  await page.mouse.down()
  await page.mouse.move(edge.x - 240, edge.y + 200, { steps: 8 })
  await page.mouse.up()
  const wide = Math.round((await panel.boundingBox())!.width)
  expect(Math.abs(wide - 600)).toBeLessThan(8)
  await page.screenshot({ path: "e2e/.shots/feedback-reference-wide.png" })
  await page.reload()
  await page.getByRole("button", { name: "Got it" }).click()
  expect(Math.round((await panel.boundingBox())!.width)).toBe(wide)
  await page.getByTestId("reference-resize").dblclick()
  expect(Math.round((await panel.boundingBox())!.width)).toBe(360)
})

test("the Regions header stays in view while the rail scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 560 })
  await page.goto("./?ref=A&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click()
  const collapse = page.getByRole("button", { name: "Collapse Regions" })
  const scroller = collapse.locator("xpath=ancestor::div[contains(@class,'overflow-y-auto')][1]")
  // The rail fills in as Cranium opens; scroll once it overflows.
  await expect
    .poll(() => scroller.evaluate((el) => ((el.scrollTop = el.scrollHeight), el.scrollTop)))
    .toBeGreaterThan(0)
  await expect(collapse).toBeInViewport()
  await page.screenshot({ path: "e2e/.shots/feedback-rail-sticky.png" })
  await collapse.click()
  await expect(page.getByRole("button", { name: "Expand Regions" })).toBeVisible()
})

test("a flagged field reads as highlighted", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click()
  await page.keyboard.press("Alt+KeyF")
  const pill = page.locator("[aria-pressed=true]", { hasText: "Come back" }).first()
  await expect(pill).toBeVisible()
  expect(await pill.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(254, 240, 138)")
  await page.screenshot({ path: "e2e/.shots/feedback-flag.png" })
})

test("the reference starts on, beside the fields, and its menu moves it under the field", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click()
  await expect(page.getByRole("complementary", { name: "Reference" })).toBeVisible()
  await expect(page.getByTestId("reference-resize")).toBeVisible()
  await page.getByRole("button", { name: "Where the reference appears" }).click()
  await expect(page.getByRole("menuitemradio", { name: /Beside the fields/ })).toHaveAttribute("aria-checked", "true")
  await page.waitForTimeout(300)
  await page.screenshot({ path: "e2e/.shots/feedback-reference-menu.png" })
  await page.getByRole("menuitemradio", { name: /Under the field/ }).click()
  await expect(page.getByRole("complementary", { name: "Reference" })).toHaveCount(0)
  await expect(page.locator('[data-variable="NAS"]').getByText(/^Reference ·/)).toBeVisible()
  // The choice is kept for the next visit.
  await page.goto("./?dim=0&start=cranium-morph#/".replace("?", "?seed=fresh&"))
  await page.getByRole("button", { name: "Got it" }).click()
  await expect(page.locator('[data-variable="NAS"]').getByText(/^Reference ·/)).toBeVisible()
})

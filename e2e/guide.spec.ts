import { expect, test } from "@playwright/test"

test("Design updates: newest first, keys stay in view, notes survive leaving and go into the email", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("./?dim=0")
  await expect(page.getByRole("heading", { level: 1, name: /design updates/ })).toBeVisible()
  await page.evaluate(() => localStorage.setItem("mosaic-proto:guide-prompted", "1"))

  // Newest first.
  const dates = await page.locator("article time").evaluateAll((els) => els.map((e) => e.getAttribute("datetime")!))
  expect(dates).toEqual([...dates].sort().reverse())
  await expect(page.locator("article").first().getByText("Latest")).toBeVisible()

  // The keys column stays on screen while the updates scroll.
  await page.mouse.wheel(0, 1500)
  await page.waitForTimeout(200)
  const keys = await page.getByRole("heading", { name: "Keys", exact: true }).boundingBox()
  expect(keys!.y).toBeGreaterThanOrEqual(0)
  expect(keys!.y).toBeLessThan(200)
  await page.screenshot({ path: "e2e/.shots/design-updates-scrolled.png" })

  await expect(page.getByRole("link", { name: /Send by email/ })).toHaveAttribute("aria-disabled", "true")
  await page.getByRole("textbox", { name: /Quick fixes/ }).fill("Arrow up works well.")

  await page.getByRole("link", { name: /Go to the prototype/ }).click()
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await page.getByRole("link", { name: "Design updates" }).click()
  await expect(page.getByRole("textbox", { name: /Quick fixes/ })).toHaveValue("Arrow up works well.")

  const href = decodeURIComponent((await page.getByRole("link", { name: /Send by email/ }).getAttribute("href")) ?? "")
  expect(href).toMatch(/^mailto:jwvaugha@illinois.edu\?subject=MOSAIC design updates/)
  expect(href).toContain("Quick fixes from your first round of feedback (2026-11-09)\nArrow up works well.")
  expect(href).not.toContain("Photos in the reference panel")
  await page.screenshot({ path: "e2e/.shots/design-updates.png", fullPage: true })
})

test("A 'Try it' link opens the prototype on that section with the reference on", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("./#/guide")
  await page.locator("#update-2026-11-09-photos").getByRole("link", { name: /Dentition · Morphological/ }).click()
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dentition · Morphological")
  await expect(page.getByRole("complementary", { name: "Reference" })).toBeVisible()
})

test("Old links with the bottom dock's former letter, D, open layout B", async ({ page }) => {
  await page.goto("./?ref=D&refon=0&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await expect(page.getByRole("button", { name: "Show reference panel" })).toBeVisible()
})

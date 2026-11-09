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

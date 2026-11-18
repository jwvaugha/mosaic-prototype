import { expect, test } from "@playwright/test"
test("D and P switch drawings and photos, in the panel and the enlarged view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("./?seed=fresh&ref=A&refon=1&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await page.locator('[role="radiogroup"]').first().locator('[role="radio"]').first().focus()
  await page.keyboard.press("p")
  await expect(page.getByRole("button", { name: /Photos/ }).first()).toHaveAttribute("aria-pressed", "true")
  await page.keyboard.press("r") // close the panel; D opens it again
  await page.keyboard.press("d")
  await expect(page.getByRole("complementary", { name: "Reference" })).toBeVisible()
  await expect(page.getByRole("button", { name: /Drawings/ }).first()).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Enlarge" }).first().click()
  await page.keyboard.press("p")
  await expect(page.getByRole("dialog").getByRole("button", { name: /Photos/ })).toHaveAttribute("aria-pressed", "true")
})

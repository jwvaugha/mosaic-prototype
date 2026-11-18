import { expect, test } from "@playwright/test"

// E opens the enlarged view of the field's reference, even with the panel
// closed; Esc hands the keys back to the field.

test("E opens the state viewer at the previewed state, and Esc returns to the field", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&refon=0&dim=0&start=cranium-morph#/")
  // As the keyboard tests do: focus the first trait, Esc dismisses the intro card.
  await page.locator('[role="radiogroup"]').first().locator('[role="radio"]').first().focus()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("button", { name: "Got it" })).toHaveCount(0)
  const state2 = page.locator('[role="radiogroup"]').first().locator('[role="radio"]').nth(1)
  await expect(async () => {
    await page.keyboard.press("ArrowRight") // preview state 2
    await expect(state2).toBeFocused({ timeout: 200 })
  }).toPass({ timeout: 3000 })
  await page.keyboard.press("e")
  const viewer = page.getByRole("dialog")
  await expect(viewer).toBeVisible()
  await expect(viewer.getByRole("option", { selected: true })).toHaveAttribute("aria-label", /^State 2/)
  await page.keyboard.press("Escape")
  await expect(viewer).toHaveCount(0)
  await expect(page.locator("main :focus")).toHaveCount(1)
  // A second E on the same field opens it again.
  await page.keyboard.press("e")
  await expect(viewer).toBeVisible()
})

test("E enlarges a measurement's figure", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&refon=1&dim=0&start=cranium-metric#/")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await page.locator("[data-variable] input").first().focus()
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog")).toBeVisible()
})

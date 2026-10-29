import { expect, test } from "@playwright/test"

for (const layout of ["A", "B", "C"]) {
  test(`${layout}: clicking a chosen drawing clears it; the enlarged viewer compares and chooses states`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`./?seed=fresh&ref=${layout}&refon=1&dim=0&start=cranium-morph#/`)
    await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
    // The fresh scenario has no scores, so page-wide counts track this field.
    // CSS, not role: the open viewer hides the page from the accessibility tree.
    const row = page.locator('[role="radiogroup"]')

    // The strip: a second click on the chosen drawing clears the score.
    const thumb = page.locator("button[aria-pressed][title]").nth(1)
    await thumb.click()
    await expect(thumb).toHaveAttribute("aria-pressed", "true")
    await expect(row.locator('[aria-checked="true"]')).toHaveCount(1)
    await thumb.click()
    await expect(thumb).toHaveAttribute("aria-pressed", "false")
    await expect(row.locator('[aria-checked="true"]')).toHaveCount(0)

    // The viewer: captioned thumbnails, ←/→ to switch, Enter to choose.
    await page.getByRole("button", { name: "Enlarge" }).first().click()
    const viewer = page.getByRole("dialog")
    const options = viewer.getByRole("option")
    expect(await options.count()).toBeGreaterThan(1)
    await expect(options.first()).toHaveAttribute("aria-selected", "true")
    await page.keyboard.press("ArrowRight")
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true")
    // The row outlines the state being viewed.
    await expect(row.locator("[data-previewed]")).toHaveCount(1)
    await page.keyboard.press("Enter")
    await expect(row.locator('[aria-checked="true"]')).toHaveCount(1)
    await expect(viewer.getByRole("button", { name: /Unselect state/ })).toBeVisible()
    await page.screenshot({ path: `e2e/.shots/viewer-${layout}.png` })
    await viewer.getByRole("button", { name: /Unselect state/ }).click()
    await expect(row.locator('[aria-checked="true"]')).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expect(viewer).toHaveCount(0)
    // The viewed state stops being outlined (the focused state may still be).
    await expect(row.locator("[data-previewed][aria-label^='2:']")).toHaveCount(0)
  })
}

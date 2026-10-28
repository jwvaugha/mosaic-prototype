import { expect, test } from "@playwright/test"

test("Metric header: generic Import data with help; Show reference only while the panel is off", async ({ page }) => {
  for (const layout of ["A", "C"]) {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`./?seed=midway&ref=${layout}&dim=0&start=lower-limb-metric`)
    await page.evaluate(() => localStorage.setItem("mosaic-proto:guide-prompted", "1"))
    await page.reload()
    await expect(page.getByRole("button", { name: /Import data/ })).toBeVisible()
    await page.getByRole("button", { name: "About importing data" }).hover()
    await expect(page.getByText(/3Skull or FORDISC export/).first()).toBeVisible()
    await page.getByRole("button", { name: /Show reference/ }).click()
    await expect(page.getByRole("button", { name: /(Show|Hide) reference/ })).toHaveCount(0)
    await page.screenshot({ path: `e2e/.shots/metric-header-${layout}.png` })
  }
})

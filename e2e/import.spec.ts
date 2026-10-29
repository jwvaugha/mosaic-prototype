import { expect, test } from "@playwright/test"

test("Metric header: generic Import data with help; Show/Hide reference per layout", async ({ page }) => {
  for (const layout of ["A", "B", "C"]) {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`./?seed=midway&ref=${layout}&dim=0&start=lower-limb-metric#/`)
    await page.evaluate(() => localStorage.setItem("mosaic-proto:guide-prompted", "1"))
    await page.reload()
    await expect(page.getByRole("button", { name: /Import data/ })).toBeVisible()
    await page.getByRole("button", { name: "About importing data" }).hover()
    await expect(page.getByText(/3Skull or FORDISC export/).first()).toBeVisible()
    await page.getByRole("button", { name: /^Show reference ?R$/ }).click()
    if (layout === "A") {
      // The docked column covers that corner, so the button goes away.
      await expect(page.getByRole("button", { name: /^(Show|Hide) reference ?R$/ })).toHaveCount(0)
    } else {
      // Inline and bottom dock keep it, as Hide reference, and it turns the panel off.
      const hide = page.getByRole("button", { name: /^Hide reference ?R$/ })
      await expect(hide).toBeVisible()
      await page.screenshot({ path: `e2e/.shots/metric-header-${layout}.png` })
      await hide.click()
      await expect(page.getByRole("button", { name: /^Show reference ?R$/ })).toBeVisible()
    }
    await page.screenshot({ path: `e2e/.shots/metric-header-${layout}-after.png` })
  }
})

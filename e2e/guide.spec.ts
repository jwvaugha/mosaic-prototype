import { expect, test } from "@playwright/test"

test("Guide: answers survive leaving and coming back, and go into the email", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("./?dim=0#/guide")
  await page.evaluate(() => localStorage.setItem("mosaic-proto:guide-prompted", "1"))
  await expect(page.getByRole("link", { name: /Submit by email/ })).toHaveAttribute("aria-disabled", "true")
  await page.getByRole("textbox", { name: /Getting around/ }).fill("Tab skipped the Conditions once.")
  await page.getByRole("textbox", { name: /reference panel/ }).fill("B felt roomier than A.")

  await page.getByRole("link", { name: /Go to the prototype/ }).click()
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await page.getByRole("link", { name: "Tester guide" }).click()
  await expect(page.getByRole("textbox", { name: /Getting around/ })).toHaveValue("Tab skipped the Conditions once.")

  const href = decodeURIComponent((await page.getByRole("link", { name: /Submit by email/ }).getAttribute("href")) ?? "")
  expect(href).toMatch(/^mailto:\?subject=MOSAIC prototype feedback/)
  expect(href).toContain("Getting around\nTab skipped the Conditions once.")
  expect(href).toContain("The reference panel\nB felt roomier than A.")
  expect(href).toContain("Skip vs. \"come back to\"\n(no answer)")
  await page.screenshot({ path: "e2e/.shots/guide.png", fullPage: true })
})

test("Old links with the bottom dock's former letter, D, open layout B", async ({ page }) => {
  await page.goto("./?ref=D&dim=0&start=cranium-morph")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await expect(page.getByRole("button", { name: "Show reference panel" })).toBeVisible()
})

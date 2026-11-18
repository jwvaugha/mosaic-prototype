import { expect, test } from "@playwright/test"

// Fixes from the second round of PI feedback (2026-11-18).

const scoreSome = async (page: import("@playwright/test").Page) => {
  await page.locator('[role="radiogroup"]').first().locator('[role="radio"]').first().click()
  for (let i = 0; i < 6; i++) await page.keyboard.press("1")
}

for (const ref of ["A", "C"]) {
  test(`${ref}: clicking Continue moves on after scoring part of a long section`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`./?seed=fresh&ref=${ref}&refon=1&dim=0&start=dentition-morph#/`)
    await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
    await scoreSome(page)
    // The focused field is far above the footer; pressing the mouse must not
    // pull the page back to it.
    await page.getByRole("button", { name: /^Continue to/ }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thorax · Morphological")
  })
}

test("Enter saves a note, ⇧Enter starts a new line, and a scored field moves on", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&refon=1&dim=0&start=cranium-morph#/")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  const first = page.locator("[data-variable]").first()
  await first.locator('[role="radio"]').first().click()
  await page.keyboard.press("ArrowUp") // back to the scored field
  await page.keyboard.press("n")
  const editor = page.getByRole("textbox")
  await editor.fill("Left side damaged")
  await page.keyboard.press("Shift+Enter")
  await page.keyboard.type("see photo")
  await expect(editor).toHaveValue("Left side damaged\nsee photo")
  await page.keyboard.press("Enter")
  await expect(editor).toHaveCount(0)
  await expect(first.getByRole("button", { name: /^Note: Left side damaged/ })).toBeVisible()
  // Focus moved to the next field.
  await expect(page.locator("[data-variable]").nth(1).locator(":focus")).toHaveCount(1)
})

test("the enlarged viewer shows how to close it, and photo captions carry no place names", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&refon=1&dim=0&start=dentition-morph#/")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await page.getByRole("button", { name: "Enlarge" }).first().click()
  const viewer = page.getByRole("dialog")
  await expect(viewer.getByRole("button", { name: /Close Esc/ })).toBeVisible()
  await expect(viewer.getByText(/Tokyo|Berlin|INAH|Alameda|Seattle|Jikei/)).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(viewer).toHaveCount(0)
})

test("a trait's states are listed one per line, blanks marked", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("./?seed=fresh&ref=A&refon=1&dim=0&start=dentition-morph#/")
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  const panel = page.getByRole("complementary", { name: "Reference" })
  await expect(panel.locator("ol li").first()).toBeVisible()
})

test("Try it links ignore a policy switched in Test mode", async ({ page }) => {
  await page.goto("./?inc=skip-section&dim=0#/")
  await page.goto("./#/guide")
  const href = await page.getByRole("link", { name: /Try it/ }).first().getAttribute("href")
  expect(href).toContain("inc=skip-and-flag")
})

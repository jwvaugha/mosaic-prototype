import { expect, test, type Page } from "@playwright/test"

// Laptop and tablet widths, down to a 768 px tablet in portrait. Phones are
// out of scope for now. Each width × reference layout is checked for:
//   - no horizontal scrolling of the page or the main pane
//   - the app header fitting on one line, with nothing overlapping
//   - the reference panel and its images staying on screen
// Screenshots go to e2e/.shots for review.

const WIDTHS = [1440, 1280, 1152, 1024, 900, 768]
const LAYOUTS = ["A", "C", "D"] as const

async function open(page: Page, width: number, layout: string, section = "cranium-morph") {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(`./?seed=midway&ref=${layout}&auto=morph,metric&dim=0&start=${section}`)
  await page.evaluate(() => localStorage.setItem("mosaic-proto:guide-prompted", "1"))
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(300)
}

// Pairs of direct header children whose boxes overlap.
async function headerOverlaps(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector("header")!
    const kids = [...header.children].filter((el) => (el as HTMLElement).offsetWidth > 0)
    const boxes = kids.map((el) => ({ el: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30), r: el.getBoundingClientRect() }))
    const out: string[] = []
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r, b = boxes[j].r
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push(`${boxes[i].el} × ${boxes[j].el}`)
      }
    const offscreen = boxes.filter((b) => b.r.right > innerWidth + 1).map((b) => b.el)
    return { overlaps: out, offscreen, height: header.getBoundingClientRect().height }
  })
}

for (const width of WIDTHS) {
  for (const layout of LAYOUTS) {
    for (const section of ["cranium-morph", "lower-limb-metric"]) {
      test(`${width}px · ${layout} · ${section}`, async ({ page }) => {
        await open(page, width, layout, section)
        await page.screenshot({ path: `e2e/.shots/${width}-${layout}-${section}.png` })

        const page_ = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth }))
        expect.soft(page_.sw, "page scrolls sideways").toBeLessThanOrEqual(page_.w)

        const h = await headerOverlaps(page)
        expect.soft(h.overlaps, "header items overlap").toEqual([])
        expect.soft(h.offscreen, "header items off screen").toEqual([])
        expect.soft(h.height, "header wraps").toBeLessThanOrEqual(57)

        const pane = await page.evaluate(() => {
          const m = document.querySelector("main")!
          return { sw: m.scrollWidth, cw: m.clientWidth }
        })
        expect.soft(pane.sw, "main pane scrolls sideways").toBeLessThanOrEqual(pane.cw + 1)

        // A row's actions share the line with its input (they fold into "⋯"
        // rather than wrapping onto an empty line of their own).
        const wrapped = await page.evaluate(() =>
          [...document.querySelectorAll("[data-variable]")].slice(0, 25).flatMap((row) => {
            const trail = row.querySelector(".\\@container")?.parentElement
            const control = row.querySelector('[id^="field-"]')?.closest(".shrink-0")
            if (!trail || !control) return []
            const t = trail.getBoundingClientRect(), c = control.getBoundingClientRect()
            return t.top > c.bottom - 4 ? [(row as HTMLElement).dataset.variable] : []
          }),
        )
        expect.soft(wrapped, "row actions wrapped below the input").toEqual([])

        // Reference panel (and its images) on screen.
        const ref = await page.evaluate(() => {
          const el = document.querySelector('[aria-label="Reference"]')
          if (!el) return null
          const r = el.getBoundingClientRect()
          const imgs = [...el.querySelectorAll("img")].map((i) => i.getBoundingClientRect())
          return {
            right: r.right,
            bottom: r.bottom,
            imgOut: imgs.filter((i) => i.right > r.right + 1 || i.left < r.left - 1 || i.right > innerWidth + 1).length,
            vw: innerWidth,
            vh: innerHeight,
          }
        })
        expect.soft(ref, "reference panel shows").not.toBeNull()
        if (ref) {
          expect.soft(ref.right, "reference panel off screen").toBeLessThanOrEqual(ref.vw + 1)
          expect.soft(ref.imgOut, "reference images spill out").toBe(0)
        }
      })
    }
  }
}

test.describe("Region rail", () => {
  test("collapses to a strip and expands again (wide screens push the content)", async ({ page }) => {
    await open(page, 1440, "A")
    const main = page.locator("main")
    const before = (await main.boundingBox())!.width
    await page.getByRole("button", { name: "Collapse Regions" }).click()
    await expect(page.getByRole("button", { name: "Expand Regions" })).toBeVisible()
    const after = (await main.boundingBox())!.width
    expect(after).toBeGreaterThan(before + 200)
    // The strip's Region codes open that Region.
    await page.getByRole("button", { name: /^Lower limb,/ }).click()
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lower limb · Metric")
    await page.getByRole("button", { name: "Expand Regions" }).click()
    await expect(page.getByRole("button", { name: "Collapse Regions" })).toBeVisible()
  })

  test("starts collapsed below 1024 px and floats over the content when opened", async ({ page }) => {
    await open(page, 900, "C")
    await expect(page.getByRole("button", { name: "Expand Regions" })).toBeVisible()
    const main = page.locator("main")
    const before = (await main.boundingBox())!.width
    await page.getByRole("button", { name: "Expand Regions" }).click()
    await expect(page.getByRole("button", { name: "Collapse Regions" })).toBeVisible()
    expect((await main.boundingBox())!.width).toBe(before)
    await page.screenshot({ path: "e2e/.shots/900-rail-open.png" })
    // Choosing a section closes it again.
    await page.getByRole("treeitem", { name: /^Mandible/ }).click()
    await page.getByRole("treeitem", { name: /^Metric/ }).first().click()
    await expect(page.getByRole("button", { name: "Expand Regions" })).toBeVisible()
  })
})

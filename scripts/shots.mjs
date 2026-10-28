// Interactive screenshots with the local Chrome: each scenario is a query,
// a list of steps (keys or clicks), and an output file.
//   node scripts/shots.mjs <outDir> [filter]
import { spawn } from "node:child_process"
import puppeteer from "puppeteer-core"

const out = process.argv[2]
const filter = process.argv[3] ?? ""
const server = spawn("npx", ["vite", "preview", "--port", "4317", "--strictPort"], { stdio: "ignore" })
await new Promise((r) => setTimeout(r, 1500))

const SCENARIOS = {
  "1.1-hint": { q: "?inc=skip-section&seed=fresh", steps: [] },
  "1.2-skip": { q: "?inc=skip-section&seed=midway", steps: [["key", "Minus"], ["key", "Minus"]] },
  "1.3-check": { q: "?inc=skip-section&seed=midway", steps: [["click", "button::-p-text(Continue to Lower limb)"]] },
  "1.4-toast": { q: "?inc=skip-section&seed=midway", steps: [["click", "button::-p-text(Continue to Lower limb)"], ["click", "button::-p-text(Skip 5 and continue)"]] },
  "2.1-offer": { q: "?inc=flag-section&seed=midway", steps: [["dismiss"]] },
  "2.2-flagged": { q: "?inc=flag-section&seed=midway", steps: [["dismiss"], ["alt", "KeyF"]] },
  "2.3-check": { q: "?inc=flag-section&seed=midway", steps: [["dismiss"], ["alt", "KeyF"], ["key", "Tab"], ["alt", "KeyF"], ["click", "button::-p-text(Continue to Lower limb)"]] },
  "2.5.2-badge": { q: "?inc=flag-end&seed=midway", steps: [["dismiss"], ["alt", "KeyF"], ["key", "Tab"], ["key", "Tab"], ["alt", "KeyF"], ["click", "button::-p-text(Continue to Lower limb)"]] },
  "2.5.3-pre": { q: "?inc=flag-end&seed=midway", steps: [["dismiss"], ["alt", "KeyF"], ["click", "button::-p-text(Analyze)"]] },
  "1-pre": { q: "?inc=skip-section&seed=midway", steps: [["dismiss"], ["click", "button::-p-text(Analyze)"]] },
  "metric": { q: "?inc=skip-section&seed=midway", steps: [["dismiss"], ["chord", "ArrowDown"]] },
  "panel": { q: "?inc=flag-end&seed=midway&ref=D,C&auto=morph", steps: [["dismiss"], ["click", "button::-p-text(Test mode)"]] },
  "ref-A-morph": { q: "?inc=skip-section&seed=midway&ref=A,A&auto=morph,metric", steps: [["dismiss"]] },
  "ref-C-morph": { q: "?inc=skip-section&seed=midway&ref=C,C&auto=morph,metric", steps: [["dismiss"]] },
  "ref-D-morph": { q: "?inc=skip-section&seed=midway&ref=D,D&auto=morph,metric", steps: [["dismiss"]] },
  "ref-A-metric": { q: "?inc=skip-section&seed=midway&ref=A,A&auto=morph,metric", steps: [["dismiss"], ["chord", "ArrowDown"]] },
  "ref-C-metric": { q: "?inc=skip-section&seed=midway&ref=C,C&auto=morph,metric", steps: [["dismiss"], ["chord", "ArrowDown"]] },
  "ref-D-metric": { q: "?inc=skip-section&seed=midway&ref=D,D&auto=morph,metric", steps: [["dismiss"], ["chord", "ArrowDown"]] },
}

const launch = () =>
  puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    defaultViewport: { width: 1440, height: 1024 },
    // Without this, headless Chrome on macOS crashes more often.
    args: ["--disable-gpu"],
  })

// Headless Chrome on this Mac sometimes exits mid-run, so each scenario gets
// a fresh browser and up to three tries.
async function shoot(name, s) {
  const browser = await launch()
  try {
    const page = await browser.newPage()
    await page.goto(`http://localhost:4317/mosaic-prototype/${s.q}`, { waitUntil: "load" })
    await page.evaluate(() => localStorage.clear())
    await new Promise((r) => setTimeout(r, 300))
    for (const [kind, arg] of s.steps) {
      if (kind === "key") await page.keyboard.press(arg)
      if (kind === "alt") { await page.keyboard.down("Alt"); await page.keyboard.press(arg); await page.keyboard.up("Alt") }
      if (kind === "chord") { await page.keyboard.down("Control"); await page.keyboard.down("Alt"); await page.keyboard.press(arg); await page.keyboard.up("Alt"); await page.keyboard.up("Control") }
      if (kind === "click") await (await page.waitForSelector(arg)).click()
      if (kind === "dismiss") { const b = await page.$("button::-p-text(Got it)"); if (b) await b.click() }
      await new Promise((r) => setTimeout(r, 250))
    }
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: `${out}/${name}.png` })
    return true
  } catch (e) {
    console.log("retry", name, e.message.split("\n")[0].slice(0, 80))
    return false
  } finally {
    await browser.close().catch(() => {})
  }
}

for (const [name, s] of Object.entries(SCENARIOS)) {
  if (!name.includes(filter)) continue
  let ok = false
  for (let i = 0; i < 3 && !ok; i++) ok = await shoot(name, s)
  if (!ok) console.log("FAILED", name)
}
server.kill()

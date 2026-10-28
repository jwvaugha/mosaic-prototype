import type { SeedId } from "@/data/seeds"
import type { Modality } from "@/data/types"
import type { IncompletionId } from "@/policies/incompletion"

// Prototype-only settings, switched in the test-mode panel. Stored in the URL
// query (so a setup can be shared as a link) and in localStorage.

export type RefLayout = "A" | "C" | "D"

export type TestConfig = {
  // One layout for both modalities.
  refLayout: RefLayout
  // Annotation 9 on Explorations: C on demand, A or D for auto-show.
  refOnDemandLayout: "same" | "C"
  autoShow: Record<Modality, boolean>
  incompletion: IncompletionId
  showKeyHints: boolean
  seed: SeedId
  // Section the Workup opens on (default: the first in rail order). Used by
  // the guide's setup links and by tests.
  start?: string
}

export const DEFAULT_CONFIG: TestConfig = {
  refLayout: "A",
  refOnDemandLayout: "same",
  autoShow: { morph: true, metric: true },
  incompletion: "skip-section",
  showKeyHints: true,
  seed: "fresh",
}

const LAYOUTS = ["A", "C", "D"]
const INCOMPLETION = ["skip-section", "flag-section", "flag-end"]
const SEEDS = ["fresh", "midway"]

// ?ref=D&ondemand=C&auto=morph,metric&inc=flag-end&hints=0&seed=midway
export function toQuery(c: TestConfig): string {
  const p = new URLSearchParams()
  p.set("ref", c.refLayout)
  if (c.refOnDemandLayout === "C") p.set("ondemand", "C")
  p.set("auto", (["morph", "metric"] as const).filter((m) => c.autoShow[m]).join(",") || "none")
  p.set("inc", c.incompletion)
  if (!c.showKeyHints) p.set("hints", "0")
  if (c.seed !== "fresh") p.set("seed", c.seed)
  if (c.start) p.set("start", c.start)
  return p.toString()
}

export function fromQuery(query: string, base: TestConfig = DEFAULT_CONFIG): TestConfig {
  const p = new URLSearchParams(query)
  const c = structuredClone(base)
  // Older links carried one layout per modality ("A,C"); the first wins.
  const ref = (p.get("ref") ?? "").split(",")[0]
  if (LAYOUTS.includes(ref)) c.refLayout = ref as RefLayout
  if (p.has("ondemand")) c.refOnDemandLayout = p.get("ondemand") === "C" ? "C" : "same"
  if (p.has("auto")) {
    const auto = p.get("auto")!.split(",")
    c.autoShow = { morph: auto.includes("morph"), metric: auto.includes("metric") }
  }
  const inc = p.get("inc")
  if (inc && INCOMPLETION.includes(inc)) c.incompletion = inc as IncompletionId
  if (p.has("hints")) c.showKeyHints = p.get("hints") !== "0"
  const seed = p.get("seed")
  if (seed && SEEDS.includes(seed)) c.seed = seed as SeedId
  const start = p.get("start")
  if (start && /^[a-z-]+$/.test(start)) c.start = start
  return c
}

// Bumped when defaults change, so earlier visits don't keep stale settings.
const STORAGE_KEY = "mosaic-prototype-config-v3"

export function loadConfig(): TestConfig {
  let stored = DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) stored = { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    // Storage can be unavailable; the URL and defaults still work.
  }
  return window.location.search ? fromQuery(window.location.search, stored) : stored
}

export function saveConfig(c: TestConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
  } catch {
    // ignore
  }
  const url = `${window.location.pathname}?${toQuery(c)}${window.location.hash}`
  window.history.replaceState(null, "", url)
}

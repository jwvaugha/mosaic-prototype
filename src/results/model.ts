// One Analysis's results, shaped like the model's real output (see the
// reviewers' model handbook, https://claude.ai/artifact/WXvKKHTP7M3RskjdtLPGWe):
// Age and Stature return an estimate, a nominal 90% range and probabilities
// over bands; Sex and Census category return every category's probability.
// Terms follow CONTEXT.md (Results, Results packet, Analysis).

export type NumericResult = {
  kind: "numeric"
  lo: number
  step: number
  probs: number[]
  estimate: number
  lower: number
  upper: number
  // Bands drawn for the prototype, not given by the model.
  illustrative?: boolean
}

export type CategoricalResult = {
  kind: "categorical"
  // Highest first.
  categories: { label: string; p: number; trainingN?: number }[]
  illustrative?: boolean
}

// Below the minimum-evidence threshold: no number is shown.
export type NotEnough = {
  kind: "not-enough"
  reason: string
  // Present Regions whose observations would inform this estimate.
  wouldHelp: string[]
}

export type EstimateId = "sex" | "age" | "affinity" | "stature"

export type Estimate = {
  id: EstimateId
  title: string
  unit?: string
  result: NumericResult | CategoricalResult | NotEnough
}

export type UsedGroup = { region: string; variables: { name: string; note?: string }[] }
export type NotAnalysed = { name: string; region: string; reason: string }

export type Analysis = {
  workupLabel: string
  number: number
  ranAt: string
  estimates: Record<EstimateId, Estimate>
  used: UsedGroup[]
  notAnalysed: NotAnalysed[]
}

// How Age and Stature lead (PI question, 2026-11-11).
export type Lead = "range" | "estimate" | "chart" | "band"

export const LEADS: { id: Lead; label: string; hint: string }[] = [
  { id: "range", label: "Range first", hint: "37–90 years, then the best estimate" },
  { id: "estimate", label: "Best estimate first", hint: "64 years, then the range" },
  { id: "chart", label: "Chart first", hint: "The bands lead; numbers are labels" },
  { id: "band", label: "Most likely band", hint: "60–70 years, then the range" },
]

export const MODEL = { version: "2026-10", trained: "1 October 2026", dictionary: "10.1.26" }

// Whole percents, capped so 0.99999999981 never reads as 100%.
export function pct(p: number) {
  if (p > 0.99) return ">99%"
  if (p < 0.01) return "<1%"
  return `${Math.round(p * 100)}%`
}

export const bandStart = (r: NumericResult, i: number) => r.lo + r.step * i
export const bandLabel = (r: NumericResult, i: number) => `${bandStart(r, i)}–${bandStart(r, i + 1)}`
export const topBand = (r: NumericResult) => r.probs.indexOf(Math.max(...r.probs))
export const inRange = (r: NumericResult, i: number) => bandStart(r, i + 1) > r.lower && bandStart(r, i) < r.upper
export const est = (r: NumericResult) => Math.round(r.estimate)
export const rangeText = (r: NumericResult) => `${Math.round(r.lower)}–${Math.round(r.upper)}`

export function normalBands(lo: number, step: number, n: number, mean: number, sd: number) {
  const raw = Array.from({ length: n }, (_, i) => {
    const mid = lo + step * (i + 0.5)
    return Math.exp(-((mid - mean) ** 2) / (2 * sd * sd))
  })
  const total = raw.reduce((a, b) => a + b, 0)
  return raw.map((p) => p / total)
}

// One line for a case report: the headline of each estimate shown.
export function summaryLine(a: Analysis, showAffinity: boolean) {
  const parts = (["sex", "age", "affinity", "stature"] as EstimateId[])
    .filter((id) => showAffinity || id !== "affinity")
    .map((id) => {
      const e = a.estimates[id]
      const r = e.result
      if (r.kind === "not-enough") return `${e.title}: not enough evidence`
      if (r.kind === "categorical") return `${e.title}: ${r.categories[0].label} ${pct(r.categories[0].p)}`
      return `${e.title}: ${rangeText(r)} ${e.unit} (best estimate ${est(r)})`
    })
  return `MOSAIC model ${MODEL.version}, ${a.workupLabel} ANALYSIS-${a.number} (${a.ranAt}). ${parts.join("; ")}.`
}

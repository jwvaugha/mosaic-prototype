import { CircleSlash } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { BandChart } from "./band-chart"
import {
  bandLabel,
  est,
  pct,
  rangeText,
  topBand,
  type CategoricalResult,
  type Lead,
  type NotEnough,
  type NumericResult,
} from "./model"

// The pieces of a result, shared by the results screen and the layout
// comparison page so both use the same type and spacing.
//   size "section"  the estimate's own section: 36px headline
//   size "tile"     the summary row: 24px headline

type Size = "section" | "tile"

export function Headline({ value, unit, size }: { value: ReactNode; unit?: string; size: Size }) {
  return (
    <p
      className={cn(
        "font-semibold tracking-tight tabular-nums",
        size === "section" ? "text-4xl" : "text-2xl",
      )}
    >
      {value}
      {unit && (
        <span className={cn("ml-1.5 font-normal tracking-normal text-muted-foreground", size === "section" ? "text-lg" : "text-sm")}>
          {unit}
        </span>
      )}
    </p>
  )
}

export function Secondary({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground tabular-nums">{children}</p>
}

export const Strong = ({ children }: { children: ReactNode }) => (
  <span className="font-medium text-foreground">{children}</span>
)

// The headline and its secondary line, per lead. "chart" has no text
// headline: the chart leads and the numbers follow it.
export function NumericText({ r, unit, lead, size }: { r: NumericResult; unit: string; lead: Lead; size: Size }) {
  const t = topBand(r)
  switch (lead) {
    case "range":
      return (
        <>
          <Headline value={rangeText(r)} unit={unit} size={size} />
          <Secondary>
            Range · best estimate <Strong>{est(r)}</Strong>
          </Secondary>
        </>
      )
    case "estimate":
      return (
        <>
          <Headline value={est(r)} unit={unit} size={size} />
          <Secondary>
            Best estimate · range <Strong>{rangeText(r)}</Strong>
          </Secondary>
        </>
      )
    case "band":
      return (
        <>
          <Headline value={bandLabel(r, t)} unit={unit} size={size} />
          <Secondary>
            Most likely band, <Strong>{pct(r.probs[t])}</Strong>
            {size === "section" ? (
              <>
                {" "}
                · range {rangeText(r)} · best estimate {est(r)}
              </>
            ) : null}
          </Secondary>
        </>
      )
    case "chart":
      return (
        <Secondary>
          Range <Strong>{rangeText(r)}</Strong> {unit} · best estimate <Strong>{est(r)}</Strong>
        </Secondary>
      )
  }
}

// Age or Stature as a whole: text and chart, in the order the lead sets.
// `wide` (a full-width section, as in the tabs layout) puts the text beside
// the chart; otherwise (a half-width card in the 2×2 grid) they stack.
export function NumericResultView({ r, unit, lead, wide }: { r: NumericResult; unit: string; lead: Lead; wide?: boolean }) {
  if (lead === "chart") {
    return (
      <div className="flex flex-col gap-3">
        <BandChart r={r} unit={unit} height={wide ? "h-48" : "h-40"} showRange />
        <NumericText r={r} unit={unit} lead={lead} size="section" />
      </div>
    )
  }
  return (
    <div className={cn("grid gap-x-10 gap-y-5", wide && "items-end md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
      <div className={cn("flex flex-col gap-1", wide && "self-center")}>
        <NumericText r={r} unit={unit} lead={lead} size="section" />
      </div>
      <BandChart r={r} unit={unit} highlightTop={lead === "band"} />
    </div>
  )
}

export function NumericTile({ r, unit, lead }: { r: NumericResult; unit: string; lead: Lead }) {
  if (lead === "chart") {
    return (
      <div className="flex flex-col gap-2">
        <BandChart r={r} unit={unit} height="h-12" compact />
        <Secondary>
          <Strong>{rangeText(r)}</Strong> {unit} · est. {est(r)}
        </Secondary>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-0.5">
      <NumericText r={r} unit={unit} lead={lead} size="tile" />
    </div>
  )
}

// Every category's probability, highest first.
export function ProbabilityRows({ r, showTrainingN }: { r: CategoricalResult; showTrainingN?: boolean }) {
  return (
    <table className="w-full text-sm tabular-nums">
      <thead className={showTrainingN ? "" : "sr-only"}>
        <tr className="text-xs text-muted-foreground">
          <th className="pb-1 text-left font-normal">
            <span className="sr-only">Category</span>
          </th>
          <th className="pb-1 text-left font-normal">
            <span className="sr-only">Probability</span>
          </th>
          {showTrainingN && <th className="w-px pb-1 pl-4 text-right font-normal whitespace-nowrap max-sm:hidden">In training data</th>}
        </tr>
      </thead>
      <tbody>
        {r.categories.map((c, i) => (
          <tr key={c.label}>
            <td className="w-[40%] py-1.5 pr-4 leading-tight">
              <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{c.label}</span>
            </td>
            <td className="py-1.5">
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className={cn("h-full rounded-full", i === 0 ? "bg-chart-1" : "bg-chart-1/40")}
                    style={{ width: `${c.p * 100}%` }}
                  />
                </div>
                <span className={cn("w-10 text-right", i === 0 ? "font-medium" : "text-muted-foreground")}>{pct(c.p)}</span>
              </div>
            </td>
            {showTrainingN && (
              <td className="w-px py-1.5 pl-4 text-right whitespace-nowrap text-muted-foreground max-sm:hidden">{c.trainingN?.toLocaleString()}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function CategoricalHeadline({ r, size }: { r: CategoricalResult; size: Size }) {
  return <Headline value={r.categories[0].label} unit={pct(r.categories[0].p)} size={size} />
}

// The summary tile: the top category, then the runner-up, so a 65/35 split
// doesn't read as a verdict.
export function CategoricalTile({ r }: { r: CategoricalResult }) {
  const [, next] = r.categories
  return (
    <div className="flex flex-col gap-0.5">
      <CategoricalHeadline r={r} size="tile" />
      {next && (
        <Secondary>
          Next: {next.label} <Strong>{pct(next.p)}</Strong>
        </Secondary>
      )}
    </div>
  )
}

export function NotEnoughView({ r, size }: { r: NotEnough; size: Size }) {
  if (size === "tile")
    return (
      <div className="flex flex-col gap-0.5">
        <p className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
          <CircleSlash className="size-4" /> Not enough evidence
        </p>
        <Secondary>{r.reason}</Secondary>
      </div>
    )
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-4 text-sm leading-6">
      <CircleSlash className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">Not enough evidence for an estimate</p>
        <p className="text-muted-foreground">
          {r.reason} Observations from <Strong>{r.wouldHelp.join(" or ")}</Strong> would inform it, if those Regions are
          present.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary tile encodings (Figma "B · Drawn proportions and intervals", as
// edited by Jackson 2026-11-11). Each kind of information gets its own form:
// the answer is the headline; a probability is drawn as a part of the whole;
// a range is drawn on the plausible scale for that estimate, with the best
// estimate marked. The numbers label the drawing.

// Top answer, runner-up and (for more than two categories) all the others,
// as one split bar with the shares labelled underneath.
export function SplitBar({ r }: { r: CategoricalResult }) {
  const [top, next, ...rest] = r.categories
  const binary = rest.length === 0
  const others = rest.reduce((a, c) => a + c.p, 0)
  const segs = [
    { p: top.p, cls: "bg-chart-1" },
    { p: next.p, cls: "bg-chart-1/35" },
    ...(!binary && others > 0.0005 ? [{ p: others, cls: "bg-chart-1/15" }] : []),
  ]
  const restLabel = binary ? next.label.toLowerCase() : "all others"
  const restP = binary ? next.p : next.p + others
  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex h-2 gap-px overflow-hidden rounded-full"
        role="img"
        aria-label={`${top.label} ${pct(top.p)}, ${binary ? next.label : "all others"} ${pct(restP)}`}
      >
        {segs.map((sg, i) => (
          <div key={i} className={sg.cls} style={{ flexGrow: sg.p, flexBasis: 0 }} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 tabular-nums" aria-hidden>
        <span className="flex items-center gap-1">
          <span className="text-sm font-semibold">{pct(top.p)}</span>
          {binary && <span className="text-xs text-muted-foreground">{top.label.toLowerCase()}</span>}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="text-xs">{restLabel}</span>
          <span className="text-sm">{pct(restP)}</span>
        </span>
      </div>
    </div>
  )
}

// The range on the estimate's plausible scale (the model's band edges: age
// 10–110, stature 130–205), with a tick at the best estimate.
export function IntervalStrip({ r, middle }: { r: NumericResult; middle: { label: string; value: string } }) {
  const lo = r.lo
  const hi = r.lo + r.probs.length * r.step
  const at = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`
  return (
    <div className="flex flex-col gap-1">
      <div
        className="relative h-3.5"
        role="img"
        aria-label={`Range ${rangeText(r)} on a scale from ${lo} to ${hi}, best estimate ${est(r)}`}
      >
        <div className="absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-muted" />
        <div
          className="absolute top-1 h-1.5 rounded-full bg-chart-1"
          style={{ left: at(r.lower), width: `calc(${at(r.upper)} - ${at(r.lower)})` }}
        />
        <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: at(r.estimate) }} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums" aria-hidden>
        <span>{lo}</span>
        <span className="flex items-center gap-1">
          {middle.label}
          <span className="text-sm font-semibold text-foreground">{middle.value}</span>
        </span>
        <span>{hi}</span>
      </div>
    </div>
  )
}

// What a numeric tile states as its answer, and what the strip's middle
// label shows, for each lead.
export function numericSummary(r: NumericResult, lead: Lead): { value: string; middle: { label: string; value: string } } {
  const t = topBand(r)
  switch (lead) {
    case "estimate":
      return { value: String(est(r)), middle: { label: "range", value: rangeText(r) } }
    case "band":
      return { value: bandLabel(r, t), middle: { label: "most likely band,", value: pct(r.probs[t]) } }
    default:
      return { value: rangeText(r), middle: { label: "best estimate", value: String(est(r)) } }
  }
}

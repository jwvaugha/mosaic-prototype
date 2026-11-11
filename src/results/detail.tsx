import { Info } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { BandChart } from "./band-chart"
import { bandLabel, est, pct, rangeText, topBand, type CategoricalResult, type Lead, type NumericResult } from "./model"
import { Headline } from "./parts"

// The estimate detail sections, encoded like Figma exploration A ("labelled
// quantities", 2026-11-11): the answer is the headline (a category, or a
// range with its unit); every other number is a figure followed by a word
// saying what it is ("65% probability", "64 best estimate"). Units stay
// small and muted beside their number, so a probability never reads as a
// unit.

// A number and what it is: "64 best estimate".
export function Figure({ value, label, size = "md" }: { value: string; label: ReactNode; size?: "md" | "sm" }) {
  return (
    <p className="flex items-baseline gap-1.5 tabular-nums">
      <span className={cn("font-semibold text-foreground", size === "md" ? "text-xl" : "text-base")}>{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </p>
  )
}

// ---------------------------------------------------------------------------
// Age and Stature

function NumericFigures({ r, unit, lead }: { r: NumericResult; unit: string; lead: Lead }) {
  const t = topBand(r)
  switch (lead) {
    case "estimate":
      return (
        <>
          <Headline value={String(est(r))} unit={unit} size="section" />
          <Figure value={rangeText(r)} label="range (the model's nominal 90%)" />
        </>
      )
    case "band":
      return (
        <>
          <Headline value={bandLabel(r, t)} unit={unit} size="section" />
          <Figure value={pct(r.probs[t])} label="probability of this band" />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Figure value={String(est(r))} label="best estimate" size="sm" />
            <Figure value={rangeText(r)} label="range" size="sm" />
          </div>
        </>
      )
    case "chart":
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <Figure value={rangeText(r)} label={`${unit} · range (nominal 90%)`} />
          <Figure value={String(est(r))} label="best estimate" />
        </div>
      )
    default:
      return (
        <>
          <Headline value={rangeText(r)} unit={unit} size="section" />
          <Figure value={String(est(r))} label="best estimate" />
          <p className="text-sm text-muted-foreground">Range: the model's nominal 90%</p>
        </>
      )
  }
}

// `wide` (full width, the tabs layout) puts the figures beside the chart;
// in the half-width grid card they stack.
export function NumericDetail({ r, unit, lead, wide }: { r: NumericResult; unit: string; lead: Lead; wide?: boolean }) {
  if (lead === "chart")
    return (
      <div className="flex flex-col gap-3">
        <BandChart r={r} unit={unit} height={wide ? "h-48" : "h-40"} showRange />
        <NumericFigures r={r} unit={unit} lead={lead} />
      </div>
    )
  return (
    <div className={cn("grid gap-x-10 gap-y-5", wide && "items-end md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
      <div className={cn("flex flex-col gap-1.5", wide && "self-center")}>
        <NumericFigures r={r} unit={unit} lead={lead} />
      </div>
      <BandChart r={r} unit={unit} highlightTop={lead === "band"} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sex and Population affinity

export function CategoricalFigures({ r }: { r: CategoricalResult }) {
  const [top, next] = r.categories
  return (
    <div className="flex flex-col gap-1.5">
      <Headline value={top.label} size="section" />
      <Figure value={pct(top.p)} label="probability" />
      {next && (
        <p className="text-sm text-muted-foreground tabular-nums">
          Next: {next.label} {pct(next.p)}
        </p>
      )}
    </div>
  )
}

const TRAINING_TOTAL = 2444 // individuals with a recorded Census category (handbook)

// The training count for one category, on hover or tap, with what it means.
// It describes the model's training data, not this skeleton, so it's kept
// out of the table.
function TrainingInfo({ label, n }: { label: string; n: number }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
  const hoverOpen = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hoverClose = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }
  const share = n / TRAINING_TOTAL
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex size-5 shrink-0 translate-y-[3px] items-center justify-center rounded-full align-baseline text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={`About ${label} in the training data`}
        onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen()}
        onPointerLeave={(e) => e.pointerType === "mouse" && hoverClose()}
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-72 text-sm leading-6"
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p>
          <span className="font-semibold tabular-nums">{n.toLocaleString()}</span> of the {TRAINING_TOTAL.toLocaleString()}{" "}
          people the model learned from were recorded as {label}{" "}
          <span className="text-muted-foreground tabular-nums">({share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`})</span>.
        </p>
        <p className="mt-2 text-muted-foreground">
          This describes the training data, not this skeleton. The model leans toward groups it saw often, so a high
          probability for a large group partly reflects that mix, and groups with few people are learned less well.
        </p>
      </PopoverContent>
    </Popover>
  )
}

// Every category's probability, highest first. The bars take the free width;
// `info` adds the training-data note to each category (Population affinity).
export function CategoryRows({ r, info, narrowLabels }: { r: CategoricalResult; info?: boolean; narrowLabels?: boolean }) {
  return (
    <table className="w-full text-sm tabular-nums">
      <thead className="sr-only">
        <tr>
          <th>Category</th>
          <th>Probability</th>
        </tr>
      </thead>
      <tbody>
        {r.categories.map((c, i) => (
          <tr key={c.label}>
            <td className={cn("py-1.5 pr-4 leading-tight", narrowLabels ? "w-px whitespace-nowrap" : "w-[44%]")}>
              <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{c.label}</span>
              {info && c.trainingN != null && (
                <>
                  {" "}
                  <TrainingInfo label={c.label} n={c.trainingN} />
                </>
              )}
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
          </tr>
        ))}
      </tbody>
    </table>
  )
}

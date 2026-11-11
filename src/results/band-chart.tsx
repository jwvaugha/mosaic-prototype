import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Bar, BarChart, Cell, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { bandLabel, bandStart, est, inRange, pct, rangeText, topBand, type NumericResult } from "./model"

// The probability of each band for Age or Stature, on shadcn's Chart
// (Recharts), so it takes the theme's chart colours and gets tooltips and
// keyboard access. The x axis is numeric, so the range and the best estimate
// sit at their exact values rather than snapping to a band.
//
//   bands inside the range   chart-1
//   bands outside it         chart-1, faint
//   most likely band         chart-2 (only when `highlightTop`)
//   best estimate            a foreground line, labelled with its value
//   range                    a shaded area with its label (`showRange`)

const config = { p: { label: "Probability", color: "var(--chart-1)" } } satisfies ChartConfig

export function BandChart({
  r,
  unit,
  height = "h-36",
  showRange,
  highlightTop,
  compact,
}: {
  r: NumericResult
  unit: string
  height?: string
  showRange?: boolean
  highlightTop?: boolean
  // Summary tiles: no axis labels or estimate label.
  compact?: boolean
}) {
  const n = r.probs.length
  const hi = r.lo + n * r.step
  const top = topBand(r)
  const data = r.probs.map((p, i) => ({ x: r.lo + r.step * (i + 0.5), p, band: bandLabel(r, i) }))
  const tickEvery = n > 10 ? 2 : 1
  const ticks = Array.from({ length: n + 1 }, (_, i) => bandStart(r, i)).filter((_, i) => i % tickEvery === 0)

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto w-full", height)}
      role="img"
      aria-label={`Probability of each ${r.step}-${unit} band from ${r.lo} to ${hi}. Range ${rangeText(r)}, best estimate ${est(r)}, most likely band ${bandLabel(r, top)}.`}
    >
      <BarChart
        data={data}
        margin={{ top: compact ? 4 : showRange ? 40 : 18, right: compact ? 2 : 14, left: compact ? 2 : 14, bottom: 0 }}
        barCategoryGap={compact ? 1 : 2}
        accessibilityLayer
      >
        <XAxis
          dataKey="x"
          type="number"
          domain={[r.lo, hi]}
          ticks={ticks}
          interval={0}
          tickLine={false}
          tickMargin={6}
          fontSize={11}
          hide={compact}
          allowDataOverflow
        />
        <YAxis hide domain={[0, Math.max(...r.probs)]} />
        {showRange && (
          <ReferenceArea
            x1={r.lower}
            x2={r.upper}
            fill="var(--muted)"
            fillOpacity={0.7}
            ifOverflow="visible"
            label={{ value: `Range ${rangeText(r)}`, position: "top", offset: 22, fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
          />
        )}
        {!compact && (
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => `${payload?.[0]?.payload?.band} ${unit}`}
                formatter={(v) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">Probability</span>
                    <span className="font-medium tabular-nums">{pct(Number(v))}</span>
                  </span>
                )}
              />
            }
          />
        )}
        <Bar dataKey="p" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={
                highlightTop && i === top
                  ? "var(--chart-2)"
                  : inRange(r, i)
                    ? "var(--color-p)"
                    : "color-mix(in oklab, var(--chart-1) 20%, transparent)"
              }
            />
          ))}
        </Bar>
        <ReferenceLine
          x={r.estimate}
          stroke="var(--foreground)"
          strokeWidth={2}
          ifOverflow="extendDomain"
          label={
            compact
              ? undefined
              : { value: String(est(r)), position: "top", fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }
          }
        />
      </BarChart>
    </ChartContainer>
  )
}

export function BandTable({ r, unit, quantity }: { r: NumericResult; unit: string; quantity: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          {open ? "Hide" : "Show"} the bands as a table
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <table className="mt-2 w-full max-w-md text-sm tabular-nums">
          <caption className="sr-only">{quantity}: probability of each band</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-1.5 font-medium">
                {quantity} ({unit})
              </th>
              <th className="py-1.5 text-right font-medium">Probability</th>
              <th className="py-1.5 pl-4 text-right font-medium">In range</th>
            </tr>
          </thead>
          <tbody>
            {r.probs.map((p, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-1">{bandLabel(r, i)}</td>
                <td className="py-1 text-right">{pct(p)}</td>
                <td className="py-1 pl-4 text-right text-muted-foreground">{inRange(r, i) ? "Yes" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleContent>
    </Collapsible>
  )
}

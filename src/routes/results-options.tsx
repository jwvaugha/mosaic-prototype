import { ArrowLeft, ArrowRight } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BandChart, BandTable } from "@/results/band-chart"
import { LEADS, pct, topBand, type CategoricalResult, type Lead, type NumericResult } from "@/results/model"
import { CategoricalHeadline, NumericText, ProbabilityRows, Strong } from "@/results/parts"
import { scenario } from "@/results/scenarios"

// Results: what should lead? The intro for the PI meeting of 2026-11-11
// (Meetings and Planning/2026-11-11-results-page-questions-for-pis.md): one
// age or stature result laid out four ways, side by side. The full screen,
// with the same parts in context, is #/results. Unlisted, so it gets no
// Design updates entry.
//
// Values come from src/results/scenarios.ts: MONO-000672's real age, sex and
// affinity output, illustrative stature bands, and a made-up split example.

const sparse = scenario("sparse")
const split = scenario("split")
const num = (r: unknown) => r as NumericResult

type Example = { id: string; label: string; quantity: string; unit: string; r: NumericResult; madeUp?: string }

const EXAMPLES: Example[] = [
  { id: "age", label: "Age", quantity: "Age at death", unit: "years", r: num(sparse.estimates.age.result) },
  {
    id: "stature",
    label: "Stature",
    quantity: "Stature",
    unit: "cm",
    r: num(sparse.estimates.stature.result),
    madeUp: "The handbook doesn't give this case's stature bands, so they're drawn around its real estimate and range.",
  },
  {
    id: "split",
    label: "Age, split evidence",
    quantity: "Age at death",
    unit: "years",
    r: num(split.estimates.age.result),
    madeUp: "Made up to show evidence pointing two ways, here toward the 40s and the 70s. The model can return this shape.",
  },
]

const NOTES: Record<Lead, { good: (r: NumericResult, unit: string) => ReactNode; watch: (r: NumericResult, unit: string) => ReactNode }> = {
  range: {
    good: () => <>Shows how uncertain the result is before anything else, whether the evidence is strong or thin.</>,
    watch: () => <>A wide range can read as no answer at all. The single number a report may need is one step down.</>,
  },
  estimate: {
    good: () => <>Familiar, and the quickest to copy into a report.</>,
    watch: (r, unit) => (
      <>
        A reader who stops at the number misses a range {Math.round(r.upper - r.lower)} {unit} wide. With split evidence
        the number can land between the two likely values.
      </>
    ),
  },
  chart: {
    good: () => <>The fullest picture: a lopsided or split result is visible at a glance.</>,
    watch: () => <>Slowest to read, and a chart can't be pasted into a written report. The numbers become labels.</>,
  },
  band: {
    good: () => <>Reads like a phase from a scoring method, with a plain-language answer.</>,
    watch: (r) => {
      const t = topBand(r)
      const runnerUp = Math.max(...r.probs.filter((_, i) => i !== t))
      return (
        <>
          Hides that {pct(1 - r.probs[t])} of the probability lies outside the band.
          {r.probs[t] - runnerUp < 0.05 && <> Here another band is nearly as likely ({pct(runnerUp)}).</>}
        </>
      )
    },
  },
}

function OptionCard({ lead, index, ex }: { lead: (typeof LEADS)[number]; index: number; ex: Example }) {
  const key = "ABCD"[index]
  const notes = NOTES[lead.id]
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card" aria-labelledby={`opt-${key}`}>
      <header className="flex items-center gap-3 border-b px-5 py-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {key}
        </span>
        <h3 id={`opt-${key}`} className="text-base font-semibold">
          {lead.label}
        </h3>
        {lead.id === "range" && (
          <Badge variant="secondary" className="ml-auto">
            Working default
          </Badge>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">{ex.quantity}</p>
          {lead.id !== "chart" && <NumericText r={ex.r} unit={ex.unit} lead={lead.id} size="section" />}
        </div>
        <BandChart
          r={ex.r}
          unit={ex.unit}
          height={lead.id === "chart" ? "h-48" : "h-36"}
          showRange={lead.id === "chart"}
          highlightTop={lead.id === "band"}
        />
        {lead.id === "chart" && <NumericText r={ex.r} unit={ex.unit} lead="chart" size="section" />}
        <BandTable r={ex.r} unit={ex.unit} quantity={ex.quantity} />
      </div>
      <dl className="grid gap-4 border-t bg-muted/40 px-5 py-4 text-sm leading-6 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <dt className="font-medium">Strength</dt>
          <dd className="text-muted-foreground">{notes.good(ex.r, ex.unit)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="font-medium">Watch for</dt>
          <dd className="text-muted-foreground">{notes.watch(ex.r, ex.unit)}</dd>
        </div>
      </dl>
    </article>
  )
}

function SectionHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex max-w-prose flex-col gap-1.5">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <p className="text-sm leading-6 text-muted-foreground">{children}</p>}
    </div>
  )
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-[3px] ${className}`} aria-hidden />
      {label}
    </span>
  )
}

export function ResultsOptions() {
  const [exampleId, setExampleId] = useState("age")
  const ex = EXAMPLES.find((e) => e.id === exampleId) ?? EXAMPLES[0]
  const sex = sparse.estimates.sex.result as CategoricalResult
  const affinity = sparse.estimates.affinity.result as CategoricalResult

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
          <a href="#/guide">
            <ArrowLeft /> Design updates
          </a>
        </Button>
        <div className="flex flex-col gap-3">
          <Badge variant="outline">For discussion · PI meeting, November 11</Badge>
          <h1 className="text-3xl font-semibold text-balance">What should lead in an age or stature result?</h1>
          <p className="max-w-prose text-base leading-7 text-muted-foreground">
            For age and stature the model returns three things: a best estimate, a range, and how likely each band of
            values is. Below, the same result is laid out four ways, each with a different part leading. The numbers
            don't change; only the order you read them in does.
          </p>
        </div>
        <Button asChild className="w-fit">
          <a href="#/results">
            See them on the full results screen <ArrowRight />
          </a>
        </Button>
      </header>

      <section className="flex flex-col gap-6" aria-labelledby="options-h">
        <div className="flex flex-col gap-5 rounded-xl bg-muted/50 p-5">
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="font-medium">Case</dt>
            <dd className="text-muted-foreground">
              MONO-000672, held out from the model's training data. Its real age isn't shown to us.
            </dd>
            <dt className="font-medium">Entered</dt>
            <dd className="text-muted-foreground">
              Sternal rib ends <Strong>5</Strong> · Pubic symphysis <Strong>4</Strong> · Tibia length{" "}
              <Strong>400 mm</Strong>
            </dd>
            <dt className="font-medium">Show</dt>
            <dd className="flex flex-col gap-2">
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={exampleId}
                onValueChange={(v) => v && setExampleId(v)}
                aria-label="Example result"
                className="flex-wrap"
              >
                {EXAMPLES.map((e) => (
                  <ToggleGroupItem key={e.id} value={e.id} className="px-3">
                    {e.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {ex.madeUp ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Badge variant="secondary" className="mt-0.5">
                    Illustrative
                  </Badge>
                  {ex.madeUp}
                </p>
              ) : (
                <p className="text-muted-foreground">The model's real output for this case.</p>
              )}
            </dd>
          </dl>
          <Separator />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <Swatch className="bg-chart-1" label="Band inside the range" />
            <Swatch className="bg-chart-1/20" label="Outside the range" />
            <Swatch className="bg-chart-2" label="Most likely band (D only)" />
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 bg-foreground" aria-hidden /> Best estimate
            </span>
            <span>Hover over a bar for its probability.</span>
          </div>
        </div>

        <h2 id="options-h" className="sr-only">
          Four layouts
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {LEADS.map((l, i) => (
            <OptionCard key={l.id} lead={l} index={i} ex={ex} />
          ))}
        </div>
        <p className="max-w-prose text-xs leading-5 text-muted-foreground">
          <Strong>Range</Strong> is what the model calls its 90% range. In testing it held the true value 83–86% of the
          time, so we label it "Range" and give both figures in a footnote. <Strong>Best estimate</Strong> is the
          model's probability-weighted average, so it can fall between two likely bands.
        </p>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="q-h">
        <div id="q-h">
          <SectionHeading title="Questions for today" />
        </div>
        <ol className="flex max-w-prose list-decimal flex-col gap-3 pl-5 text-sm leading-6 marker:font-medium marker:text-muted-foreground">
          <li>
            When you write up a biological profile, what do you report for age and stature: a range, a point estimate,
            or both? Which of these would you copy from MOSAIC into a case report?
          </li>
          <li>Should age and stature lead the same way? Stature is often reported as an estimate ± error.</li>
          <li>
            When the evidence is split (switch to <em>Age, split evidence</em>), what should the page lead with?
          </li>
          <li>Should practitioners choose the layout, or should MOSAIC use one for everyone so reports read alike?</li>
          <li>Do you need a stated confidence level next to the range, or is "Range" with a footnote enough?</li>
        </ol>
      </section>

      <Separator />

      <section className="flex flex-col gap-6" aria-labelledby="cat-h">
        <div id="cat-h">
          <SectionHeading title="For reference: sex and population affinity">
            Our direction for the two categorical results, using the same case: every category's probability, not just
            the top answer. Whether and how population affinity is shown is still yours to decide.
          </SectionHeading>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="flex flex-col gap-4 rounded-xl border bg-card p-5" aria-label="Sex">
            <p className="text-sm font-medium text-muted-foreground">Sex</p>
            <CategoricalHeadline r={sex} size="section" />
            <ProbabilityRows r={sex} />
          </section>
          <section className="flex flex-col gap-4 rounded-xl border bg-card p-5" aria-label="Population affinity">
            <p className="text-sm font-medium text-muted-foreground">
              Population affinity <span className="font-normal">(U.S. Census categories)</span>
            </p>
            <CategoricalHeadline r={affinity} size="section" />
            <ProbabilityRows r={affinity} showTrainingN />
          </section>
        </div>
      </section>
    </div>
  )
}

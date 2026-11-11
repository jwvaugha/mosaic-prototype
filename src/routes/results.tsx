import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ClipboardCopy,
  Download,
  FlaskConical,
  Info,
  LayoutGrid,
  RefreshCw,
  TestTube2,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { AppHeader } from "@/components/mosaic/app-header"
import { Choices, Field, Group, Toggle } from "@/components/mosaic/test-mode-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { BandTable } from "@/results/band-chart"
import {
  LEADS,
  MODEL,
  summaryLine,
  type Analysis,
  type Estimate,
  type EstimateId,
  type Lead,
} from "@/results/model"
import {
  Headline,
  IntervalStrip,
  NotEnoughView,
  NumericTile,
  numericSummary,
  SplitBar,
  Strong,
} from "@/results/parts"
import { CategoricalFigures, CategoryRows, NumericDetail } from "@/results/detail"
import { SCENARIOS, scenario, type ScenarioId } from "@/results/scenarios"

// The results screen for one Analysis (CONTEXT.md: Results), as decided in
// the design review of 2026-11-10 (requirements-draft.md, D5 → "results page
// design direction"). Unlisted: reached from #/results-options. The Test mode
// menu switches the example Analysis and how Age and Stature lead, so the
// layouts can be compared in context.
//
//   header        Workup label, ANALYSIS-n, time, model and dictionary
//                 versions; Copy summary and Download results packet
//   summary row   all four estimates at a glance (B style: the answer, then
//                 a split bar or the range on its scale), linking to details
//   details       'Estimates in detail': a 2×2 grid of sections, or one at a
//                 time in tabs (Test mode › Estimate details)
//   What went in  Used and Not analysed, collapsed
//   About         model version, accuracy (placeholder), how estimates chain

const ORDER: EstimateId[] = ["sex", "age", "affinity", "stature"]
const SETTINGS_KEY = "mosaic-proto:results"

// details: the estimate sections as a 2×2 grid, or one at a time in tabs
// under the summary row (a layout question for the PIs, 2026-11-11).
type Details = "grid" | "tabs"
type Settings = { scenario: ScenarioId; lead: Lead; affinity: boolean; changed: boolean; details: Details }
const DEFAULTS: Settings = { scenario: "sparse", lead: "range", affinity: true, changed: false, details: "grid" }
const DETAILS: { id: Details; label: string; hint: string }[] = [
  { id: "grid", label: "All four, in a grid", hint: "Every estimate's detail section, two by two" },
  { id: "tabs", label: "One at a time, in tabs", hint: "Pick an estimate (or click its tile) to see its detail" },
]

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") }
  } catch {
    return DEFAULTS
  }
}

function useSettings() {
  const [s, setS] = useState(loadSettings)
  const set = (patch: Partial<Settings>) =>
    setS((cur) => {
      const next = { ...cur, ...patch }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      } catch {
        // Private windows: the setting just isn't remembered.
      }
      return next
    })
  return [s, set] as const
}

// ---------------------------------------------------------------------------
// Summary row

function SummaryTile({ e, lead, onOpen, selected }: { e: Estimate; lead: Lead; onOpen: (id: EstimateId) => void; selected?: boolean }) {
  const r = e.result
  // B style for a result: the title sits on the answer, then the drawing
  // and its labels. 'Chart first' and 'Not enough evidence' keep their own
  // tiles.
  const drawn = r.kind === "categorical" || (r.kind === "numeric" && lead !== "chart")
  return (
    <a
      href={`#est-${e.id}`}
      aria-current={selected || undefined}
      onClick={(ev) => {
        ev.preventDefault()
        onOpen(e.id)
      }}
      className={cn(
        "flex flex-col rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        drawn ? "gap-4" : "gap-2",
        r.kind === "not-enough" && "border-dashed bg-muted/30",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      {drawn ? (
        <>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">{e.title}</span>
            {r.kind === "categorical" ? (
              <Headline value={r.categories[0].label} size="tile" />
            ) : (
              <Headline value={numericSummary(r, lead).value} unit={e.unit} size="tile" />
            )}
          </div>
          <div className="mt-auto">
            {r.kind === "categorical" ? <SplitBar r={r} /> : <IntervalStrip r={r} middle={numericSummary(r, lead).middle} />}
          </div>
        </>
      ) : (
        <>
          <span className="text-sm font-medium text-muted-foreground">{e.title}</span>
          {r.kind === "numeric" && <NumericTile r={r} unit={e.unit!} lead={lead} />}
          {r.kind === "not-enough" && <NotEnoughView r={r} size="tile" />}
        </>
      )}
    </a>
  )
}

// ---------------------------------------------------------------------------
// Estimate sections

function SectionCard({
  id,
  title,
  aside,
  children,
  footer,
}: {
  id: string
  title: ReactNode
  aside?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-5 py-3">
        <h2 id={`${id}-h`} className="text-base font-semibold">
          {title}
        </h2>
        {aside && <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">{aside}</div>}
      </header>
      <div className="flex flex-col gap-5 p-5">{children}</div>
      {footer && <div className="px-5 pb-3">{footer}</div>}
    </section>
  )
}

const Illustrative = () => <Badge variant="secondary">Illustrative values</Badge>

function EstimateSection({ e, lead, wide }: { e: Estimate; lead: Lead; wide?: boolean }) {
  const r = e.result
  const id = `est-${e.id}`

  if (r.kind === "not-enough")
    return (
      <SectionCard id={id} title={e.title}>
        <NotEnoughView r={r} size="section" />
      </SectionCard>
    )

  if (r.kind === "numeric")
    return (
      <SectionCard
        id={id}
        title={e.title}
        aside={
          <>
            {r.illustrative && <Illustrative />}
            <span>
              Bands of {r.step} {e.unit}
            </span>
          </>
        }
        footer={<BandTable r={r} unit={e.unit!} quantity={e.title} />}
      >
        <NumericDetail r={r} unit={e.unit!} lead={lead} wide={wide} />
      </SectionCard>
    )

  const affinity = e.id === "affinity"
  return (
    <SectionCard
      id={id}
      title={
        affinity ? (
          <>
            Population affinity <span className="font-normal text-muted-foreground">(U.S. Census categories)</span>
          </>
        ) : (
          e.title
        )
      }
      aside={r.illustrative && <Illustrative />}
    >
      <div className={cn("grid gap-x-10 gap-y-5", wide && "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
        <div className="flex flex-col gap-4">
          <CategoricalFigures r={r} />
          {affinity && (
            <div className="flex gap-2.5 rounded-lg bg-warning-muted p-3 text-sm leading-6 text-warning-muted-foreground">
              <Info className="mt-1 size-4 shrink-0" />
              <p>
                The model's least reliable result: right 73% of the time overall, but 24% when each category counts
                equally. It leans toward the largest group in its training data.
              </p>
            </div>
          )}
        </div>
        <CategoryRows r={r} info={affinity} narrowLabels={!affinity} />
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// What went into this Analysis

function WentIn({ a }: { a: Analysis }) {
  const [open, setOpen] = useState(false)
  const used = a.used.reduce((n, g) => n + g.variables.length, 0)
  const outliers = a.used.flatMap((g) => g.variables.filter((v) => v.note))
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-card">
      <CollapsibleTrigger className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none">
        <h2 className="text-base font-semibold">What went into this Analysis</h2>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            <Strong>{used}</Strong> used
          </span>
          <span aria-hidden>·</span>
          <span>
            <Strong>{a.notAnalysed.length}</Strong> not analysed
          </span>
          {outliers.length > 0 && (
            <Badge variant="outline" className="border-warning text-warning-muted-foreground">
              {outliers.length} outside training range
            </Badge>
          )}
        </span>
        <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-8 border-t px-5 py-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold">Used</h3>
              <p className="text-sm text-muted-foreground">Observations the model analysed, by Region. Values are in the bench notes.</p>
            </div>
            <div className="flex flex-col gap-4">
              {a.used.map((g) => (
                <RegionList key={g.region} region={g.region} items={g.variables} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold">Not analysed</h3>
              <p className="text-sm text-muted-foreground">Recorded in the Workup but kept out of this Analysis.</p>
            </div>
            {a.notAnalysed.length ? (
              <ul className="flex flex-col divide-y rounded-lg border text-sm">
                {a.notAnalysed.map((v) => (
                  <li key={v.name} className="flex flex-col gap-0.5 px-3 py-2">
                    <span>{v.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {v.region} · {v.reason}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing: every recorded Observation went in.</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Long Regions show their first few names and expand.
function RegionList({ region, items }: { region: string; items: { name: string; note?: string }[] }) {
  const [all, setAll] = useState(false)
  const LIMIT = 6
  const shown = all ? items : items.slice(0, LIMIT)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {region} · {items.length}
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {shown.map((v) => (
          <li key={v.name} className="flex flex-wrap items-baseline gap-x-2">
            <span>{v.name}</span>
            {v.note && <span className="text-xs text-warning-muted-foreground">{v.note}</span>}
          </li>
        ))}
      </ul>
      {items.length > LIMIT && (
        <button
          type="button"
          onClick={() => setAll((x) => !x)}
          className="w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {all ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// About this model

function About() {
  return (
    <section aria-labelledby="about-h" className="flex flex-col gap-4 rounded-xl bg-muted/50 p-5 text-sm leading-6">
      <h2 id="about-h" className="text-base font-semibold">
        About this model
      </h2>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
        <dt className="font-medium">Version</dt>
        <dd className="text-muted-foreground">
          MOSAIC model {MODEL.version}, trained {MODEL.trained} · data dictionary {MODEL.dictionary}
        </dd>
        <dt className="font-medium">Accuracy</dt>
        <dd className="text-muted-foreground">
          Being rechecked by MSU. Figures for each estimate will appear here; they describe the model overall, not this
          case.
        </dd>
        <dt className="font-medium">How the estimates connect</dt>
        <dd className="text-muted-foreground">
          The model works in order: sex, then population affinity, then age, then stature. Each step uses the ones
          before it, so adding a sex trait can shift the stature estimate.
        </dd>
        <dt className="font-medium">Range</dt>
        <dd className="text-muted-foreground">
          The model calls it a 90% range. In testing it held the true value 83–86% of the time.
        </dd>
      </dl>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Test mode

function ResultsTestMode({ s, set }: { s: Settings; set: (p: Partial<Settings>) => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.code === "KeyT") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  const lead = LEADS.find((l) => l.id === s.lead)!

  return (
    <>
      <div className="sticky bottom-0 z-30 flex h-8 items-center border-t bg-muted/60 px-4 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Test mode"
          className="flex h-5 items-center gap-1.5 rounded-full border border-dashed border-primary bg-background px-2 text-xs font-medium text-primary"
        >
          <FlaskConical className="size-3" />
          Test mode · {lead.label}
          <Kbd className="ml-0.5 h-4 text-[10px]">⌃⌥T</Kbd>
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[420px] gap-0 overflow-y-auto border-r-2 border-dashed border-r-primary bg-muted/40 sm:max-w-[420px]"
        >
          <SheetHeader className="border-b bg-background">
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="size-4" /> Prototype controls
            </SheetTitle>
            <SheetDescription>Not part of MOSAIC. Your choices are remembered in this browser.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 p-3">
            <Group icon={<BarChart3 />} title="Age and stature" note="For the PIs">
              <Field label="What leads">
                <Choices name="lead" value={s.lead} options={LEADS} onChange={(lead) => set({ lead })} />
              </Field>
            </Group>
            <Group icon={<TestTube2 />} title="Example Analysis">
              <Choices
                name="scenario"
                value={s.scenario}
                options={SCENARIOS}
                onChange={(scenario) => set({ scenario })}
              />
            </Group>
            <Group icon={<LayoutGrid />} title="Estimate details" note="For the PIs">
              <Choices name="details" value={s.details} options={DETAILS} onChange={(details) => set({ details })} />
            </Group>
            <Group icon={<RefreshCw />} title="Page">
              <Toggle label="Show population affinity" checked={s.affinity} onChange={(affinity) => set({ affinity })} />
              <Toggle label="Workup changed since this Analysis" checked={s.changed} onChange={(changed) => set({ changed })} />
            </Group>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page

export function Results() {
  const [s, set] = useSettings()
  const a = scenario(s.scenario)
  const shown = ORDER.filter((id) => s.affinity || id !== "affinity")
  const [tab, setTab] = useState<EstimateId>("sex")
  const activeTab = shown.includes(tab) ? tab : shown[0]
  // A tile opens its detail: scroll to its section (grid), or select its tab.
  const open = (id: EstimateId) => {
    if (s.details === "tabs") {
      setTab(id)
      document.getElementById("details-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" })
    } else document.getElementById(`est-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryLine(a, s.affinity))
      toast("Summary copied", { description: "One line for your case report." })
    } catch {
      toast("Couldn't copy here", { description: summaryLine(a, s.affinity) })
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-16 sm:px-6 lg:pt-8">
        {s.changed && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <Info className="size-4 shrink-0 text-primary" />
            <p className="flex-1">
              <Strong>2 Variables added</Strong> to the Workup since ANALYSIS-{a.number}. These results don't include
              them.
            </p>
            <Button size="sm">Run a new Analysis</Button>
          </div>
        )}

        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            {/* Display-only: the results prototype isn't wired to a Workup, so
                going "back" would land testers in an unrelated data-entry session. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="-ml-2 w-fit" tabIndex={0}>
                  <Button variant="ghost" size="sm" disabled className="pointer-events-none text-muted-foreground">
                    <ArrowLeft /> Back to Workup
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Display-only in the prototype</TooltipContent>
            </Tooltip>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-semibold">Results</h1>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <Strong>{a.workupLabel}</Strong>
                <span aria-hidden>·</span>
                <span>ANALYSIS-{a.number}</span>
                <span aria-hidden>·</span>
                <span>{a.ranAt}</span>
                <span aria-hidden>·</span>
                <span>Model {MODEL.version}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copy}>
              <ClipboardCopy /> Copy summary
            </Button>
            <Button onClick={() => toast("Display-only in the prototype", { description: "The packet would download here." })}>
              <Download /> Download results packet
            </Button>
          </div>
        </header>

        <section aria-label="Summary" className={cn("grid gap-3 sm:grid-cols-2", shown.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {shown.map((id) => (
            <SummaryTile key={id} e={a.estimates[id]} lead={s.lead} onOpen={open} selected={s.details === "tabs" && id === activeTab} />
          ))}
        </section>

        <section aria-labelledby="details-h" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <h2 id="details-h" className="shrink-0 text-lg font-semibold">
                Estimates in detail
              </h2>
              <Separator className="flex-1" />
            </div>
            <p className="text-sm text-muted-foreground">
              The full result behind each tile: every band or category, and how the range relates to them.
            </p>
          </div>
          {s.details === "grid" ? (
            <div className="grid items-stretch gap-4 lg:grid-cols-2">
              {shown.map((id) => (
                <EstimateSection key={id} e={a.estimates[id]} lead={s.lead} />
              ))}
            </div>
          ) : (
            <Tabs id="details-tabs" value={activeTab} onValueChange={(v) => setTab(v as EstimateId)} className="scroll-mt-6 gap-4">
              <TabsList>
                {shown.map((id) => (
                  <TabsTrigger key={id} value={id}>
                    {a.estimates[id].title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {shown.map((id) => (
                <TabsContent key={id} value={id}>
                  <EstimateSection e={a.estimates[id]} lead={s.lead} wide />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </section>

        <WentIn a={a} />
        <About />
      </main>
      <ResultsTestMode s={s} set={set} />
    </div>
  )
}

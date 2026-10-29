import { BookImage, Copy, FlaskConical, Link, RotateCcw, RefreshCw, ScrollText } from "lucide-react"
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useConfig } from "@/config/config-context"
import { DEFAULT_CONFIG, type RefLayout, type TestConfig } from "@/config/test-config"
import { fixture, localImages } from "@/data"
import { SEEDS, type SeedId } from "@/data/seeds"
import { clearEvents, getEvents, subscribeEvents } from "@/lib/event-log"
import { cn } from "@/lib/utils"
import { useWorkup } from "@/workup/workup-context"

// Prototype controls (not part of MOSAIC), opened with the pill in the
// bottom-left corner or ⌃⌥T. Two groups:
//   Reference panel   how the reference appears (layout, auto-show), which
//                     is what the prototype now compares
//   Testing           scenario, opening section, hints, resets, session log
// Skip and "come back to" used to be a third, compared choice; since the PI
// meeting of 2026-10-28 both are always available.
// Everything but the log is kept in the URL, so "Copy link" shares the setup.

const LAYOUTS: { id: RefLayout; label: string; hint: string }[] = [
  { id: "A", label: "Docked column", hint: "Beside the rows on the right; never moves" },
  { id: "B", label: "Bottom dock", hint: "A strip along the bottom of the screen" },
  { id: "C", label: "Inline", hint: "Opens under the field; the page keeps your place" },
]


function Group({ icon, title, note, children }: { icon: ReactNode; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-background p-4">
      <header className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {note && (
          <Badge variant="outline" className="ml-auto font-normal text-muted-foreground">
            {note}
          </Badge>
        )}
      </header>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

// Compact segmented cards: one row of choices, each with a one-line hint.
function Segments<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: { id: T; label: string; hint?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className="grid grid-cols-3 gap-1.5">
      {options.map((o) => (
        <Label
          key={o.id}
          htmlFor={`${name}-${o.id}`}
          className={cn(
            "flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-2.5 font-normal",
            value === o.id && "border-primary bg-primary/5",
          )}
        >
          <span className="flex items-center gap-2">
            <RadioGroupItem id={`${name}-${o.id}`} value={o.id} />
            <span className="text-sm font-medium">{o.label}</span>
          </span>
          {o.hint && <span className="text-xs leading-snug text-muted-foreground">{o.hint}</span>}
        </Label>
      ))}
    </RadioGroup>
  )
}

function Choices<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: { id: T; label: string; hint?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className="gap-1.5">
      {options.map((o) => (
        <Label
          key={o.id}
          htmlFor={`${name}-${o.id}`}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal",
            value === o.id && "border-primary bg-primary/5",
          )}
        >
          <RadioGroupItem id={`${name}-${o.id}`} value={o.id} className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{o.label}</span>
            {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
          </span>
        </Label>
      ))}
    </RadioGroup>
  )
}

export function TestModePanel({ fieldSummary }: { fieldSummary: string }) {
  const { config, setConfig, resetWorkup } = useConfig()
  const { dispatch } = useWorkup()
  const [open, setOpen] = useState(false)
  const events = useSyncExternalStore(subscribeEvents, getEvents)
  const count = (kind: string) => events.filter((e) => e.kind === kind).length

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

  const set = (update: (c: TestConfig) => TestConfig, restarts = false) => {
    setConfig(update)
    if (restarts) toast("Workup started again for the new setting.")
  }

  const minutes = events.length ? ((events.at(-1)!.t - events[0].t) / 60000).toFixed(1) : "0"
  const layout = LAYOUTS.find((l) => l.id === config.refLayout)!

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen(true)}
        aria-label="Test mode"
        // Lives in the sub-footer, the strip under the Workup footer.
        className="flex h-5 items-center gap-1.5 rounded-full border border-dashed border-primary bg-background px-2 text-xs font-medium text-primary"
      >
        <FlaskConical className="size-3" />
        Test mode · {layout.label}
        <Kbd className="ml-0.5 h-4 text-[10px]">⌃⌥T</Kbd>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[420px] gap-0 overflow-y-auto border-r-2 border-dashed border-r-primary bg-muted/40 sm:max-w-[420px]"
        >
          <SheetHeader className="border-b bg-background">
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="size-4" /> Prototype controls
            </SheetTitle>
            <SheetDescription>
              Not part of MOSAIC. The link keeps the setup, so you can share it.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 p-3">
            <Group icon={<BookImage />} title="Reference panel">
              <Field label="Layout">
                <Segments
                  name="layout"
                  value={config.refLayout}
                  options={LAYOUTS}
                  onChange={(v) => set((c) => ({ ...c, refLayout: v }))}
                />
              </Field>
              <Toggle
                label="Panel starts on (restarts the Workup)"
                checked={config.refStartsOn}
                onChange={(v) => set((c) => ({ ...c, refStartsOn: v }), true)}
              />
              <p className="text-xs text-muted-foreground">
                In the app the panel is one switch that stays as set: the button in the section header (docked and
                inline), the strip along the bottom (bottom dock), or R.
              </p>
              <p className="text-xs text-muted-foreground">
                {localImages
                  ? "Showing every reference image (local build)."
                  : "MSU and FoRDent drawings are shown. Metric figures from DCP 2.0 are grey placeholders until cleared."}
              </p>
            </Group>

            <Group icon={<ScrollText />} title="Testing">
              <Field label="Scenario (restarts the Workup)">
                <Choices
                  name="seed"
                  value={config.seed}
                  options={(Object.keys(SEEDS) as SeedId[]).map((id) => ({ id, label: SEEDS[id].label }))}
                  onChange={(v) => set((c) => ({ ...c, seed: v }), true)}
                />
              </Field>
              <Field label="Open on (restarts the Workup)">
                <Select
                  value={config.start ?? fixture.sections[0].id}
                  onValueChange={(v) => set((c) => ({ ...c, start: v }), true)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fixture.sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Toggle
                label="Show keyboard hints on rows"
                checked={config.showKeyHints}
                onChange={(v) => set((c) => ({ ...c, showKeyHints: v }))}
              />
              <Field label="Intro card">
                <Toggle
                  label="Dim the rest of the screen (intro-dim)"
                  checked={config.introDim}
                  onChange={(v) => set((c) => ({ ...c, introDim: v }))}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit"
                  onClick={() => {
                    dispatch({ type: "showHint" })
                    setOpen(false)
                  }}
                >
                  Show the intro card again
                </Button>
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    resetWorkup()
                    toast("Workup started again.")
                  }}
                >
                  <RefreshCw /> Start again
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast("Link to this setup copied.")
                  }}
                >
                  <Link /> Copy link
                </Button>
                <Button size="sm" variant="ghost" onClick={() => set(() => DEFAULT_CONFIG, true)}>
                  <RotateCcw /> Reset all settings
                </Button>
              </div>

              <Field label="Session log">
                <dl className="grid grid-cols-4 gap-1.5 text-sm">
                  {[
                    ["Keys", count("key")],
                    ["Clicks", count("click")],
                    ["Dialogs", count("dialog")],
                    ["Minutes", minutes],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border bg-background p-2">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="text-base font-semibold tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs text-muted-foreground">{fieldSummary}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify({ config, fields: fieldSummary, events }, null, 2))
                      toast("Session log copied.")
                    }}
                  >
                    <Copy /> Copy as JSON
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearEvents}>
                    Clear log
                  </Button>
                  <Button size="sm" variant="link" asChild>
                    <a href="#/guide">Tester guide</a>
                  </Button>
                </div>
              </Field>
            </Group>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

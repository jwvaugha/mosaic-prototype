import { Copy, FlaskConical, Link, RotateCcw } from "lucide-react"
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useConfig } from "@/config/config-context"
import { DEFAULT_CONFIG, type RefLayout, type TestConfig } from "@/config/test-config"
import { SEEDS, type SeedId } from "@/data/seeds"
import { localImages } from "@/data"
import { POLICIES, type IncompletionId } from "@/policies/incompletion"
import { clearEvents, getEvents, subscribeEvents } from "@/lib/event-log"
import { cn } from "@/lib/utils"

// Prototype controls (not part of MOSAIC). Opened with the pill in the
// bottom-left corner or ⌃⌥T. Everything here is stored in the URL, so "Copy
// link" shares the exact setup.

const LAYOUTS: { id: RefLayout; label: string; hint: string }[] = [
  { id: "A", label: "A · Docked column", hint: "360 px column right of the rows; never moves" },
  { id: "C", label: "C · Inline expansion", hint: "Opens under the focused row; rows below move" },
  { id: "D", label: "D · Bottom dock", hint: "Strip across the bottom; fewer rows visible" },
]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Cards<T extends string>({
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
  const { config, setConfig } = useConfig()
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

  const set = (update: (c: TestConfig) => TestConfig, resets = false) => {
    setConfig(update)
    if (resets) toast("Workup reset for the new setting.")
  }

  const minutes = events.length ? ((events.at(-1)!.t - events[0].t) / 60000).toFixed(1) : "0"

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-dashed border-primary bg-background px-3 py-1.5 text-xs font-medium text-primary shadow-sm"
      >
        <FlaskConical className="size-3.5" />
        Test mode · {POLICIES[config.incompletion].short} · {config.refLayout.morph}/{config.refLayout.metric}
        <Kbd className="ml-1">⌃⌥T</Kbd>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[400px] gap-0 overflow-y-auto border-r-2 border-dashed border-r-primary sm:max-w-[400px]">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="size-4" /> Prototype controls
            </SheetTitle>
            <SheetDescription>
              Not part of MOSAIC. Switch between the directions being compared; the URL keeps the setup.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 p-4">
            <Group title="Reference panel · Morphological">
              <Cards
                name="ref-morph"
                value={config.refLayout.morph}
                options={LAYOUTS}
                onChange={(v) => set((c) => ({ ...c, refLayout: { ...c.refLayout, morph: v } }))}
              />
            </Group>
            <Group title="Reference panel · Metric">
              <Cards
                name="ref-metric"
                value={config.refLayout.metric}
                options={LAYOUTS}
                onChange={(v) => set((c) => ({ ...c, refLayout: { ...c.refLayout, metric: v } }))}
              />
            </Group>
            <Group title="Reference panel · behaviour">
              <Cards
                name="ondemand"
                value={config.refOnDemandLayout}
                options={[
                  { id: "same", label: "Same layout when opened by hand" },
                  { id: "C", label: "Inline (C) when opened by hand", hint: "Auto-show keeps the layout above (Explorations note 9)" },
                ]}
                onChange={(v) => set((c) => ({ ...c, refOnDemandLayout: v }))}
              />
              {(["morph", "metric"] as const).map((m) => (
                <label key={m} className="flex items-center justify-between text-sm">
                  Auto-show for {m === "morph" ? "Morphological" : "Metric"} fields
                  <Switch
                    checked={config.autoShow[m]}
                    onCheckedChange={(v) => set((c) => ({ ...c, autoShow: { ...c.autoShow, [m]: v } }))}
                  />
                </label>
              ))}
              <p className="text-xs text-muted-foreground">
                {localImages
                  ? "Showing every reference image (local build)."
                  : "Morphological drawings are MSU's own. Metric figures (DCP 2.0) are placeholders at their real sizes until they're cleared."}
              </p>
            </Group>

            <Separator />

            <Group title="Incomplete fields">
              <Cards
                name="inc"
                value={config.incompletion}
                options={(Object.keys(POLICIES) as IncompletionId[]).map((id) => ({ id, label: POLICIES[id].label }))}
                onChange={(v) => set((c) => ({ ...c, incompletion: v }), true)}
              />
            </Group>

            <Group title="Scenario">
              <Cards
                name="seed"
                value={config.seed}
                options={(Object.keys(SEEDS) as SeedId[]).map((id) => ({ id, label: SEEDS[id].label }))}
                onChange={(v) => set((c) => ({ ...c, seed: v }), true)}
              />
              <label className="flex items-center justify-between text-sm">
                Show keyboard hints
                <Switch checked={config.showKeyHints} onCheckedChange={(v) => set((c) => ({ ...c, showKeyHints: v }))} />
              </label>
            </Group>

            <Separator />

            <Group title="Session log">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Keys handled", count("key")],
                  ["Clicks", count("click")],
                  ["Dialogs shown", count("dialog")],
                  ["Minutes", minutes],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-2">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="text-lg font-semibold tabular-nums">{v}</dd>
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
                  Clear
                </Button>
              </div>
            </Group>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast("Link to this setup copied.")
                }}
              >
                <Link /> Copy link
              </Button>
              <Button size="sm" variant="outline" onClick={() => set(() => DEFAULT_CONFIG, true)}>
                <RotateCcw /> Reset everything
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

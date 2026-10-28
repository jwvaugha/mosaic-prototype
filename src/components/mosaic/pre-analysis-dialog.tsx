import { ChevronDown, CircleDashed, Flag, Play, TriangleAlert } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ComeBackListItem } from "./come-back-list-item"

// Pre-Analysis check (V2 09 for the Skip version, Flows 2.5.3 for the
// come-back versions). Counts only, no values.

export type PreAnalysisProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // "both": Skip and flags together (the default since 2026-10-28)
  mode: "skip" | "flag" | "both"
  flagged: { id: string; title: string; where: string }[]
  warnings: { id: string; title: string; detail: string }[]
  blankByRegion: { region: string; blank: number; onGoTo?: () => void }[]
  totals: { recorded: number; total: number; skipped: number }
  onGoTo: (id: string) => void
  onRun: () => void
}

function Block({ icon, title, count, children }: { icon: ReactNode; title: string; count: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex h-5 items-center gap-2">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      </div>
      {children}
    </section>
  )
}

export function PreAnalysisDialog(p: PreAnalysisProps) {
  const [byRegion, setByRegion] = useState(p.mode !== "flag")
  const blank = p.blankByRegion.reduce((a, r) => a + r.blank, 0)
  const regionsWithBlanks = p.blankByRegion.filter((r) => r.blank > 0)

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100svh-4rem)] gap-4 overflow-y-auto sm:max-w-[560px]">
        <div className="flex flex-col gap-1.5">
          <DialogTitle className="text-lg">Before you run the Analysis</DialogTitle>
          <DialogDescription>
            Counts only, no values. Adding more data now strengthens every estimate. Each Analysis is logged
            separately and is never revised afterwards.
          </DialogDescription>
        </div>

        {p.mode !== "skip" && p.flagged.length > 0 && (
          <Block icon={<Flag className="size-4 text-primary" />} title="Fields you flagged to come back to" count={String(p.flagged.length)}>
            <div className="flex flex-col gap-1">
              {p.flagged.map((f) => (
                <ComeBackListItem key={f.id} title={f.title} where={f.where} onGoTo={() => p.onGoTo(f.id)} />
              ))}
            </div>
          </Block>
        )}

        <Block
          icon={<CircleDashed className="size-4 text-muted-foreground" />}
          title={p.mode === "flag" ? "Blank fields" : "Unreached Variables"}
          count={`${blank} of ${p.totals.total}`}
        >
          {p.mode !== "skip" && (
            <p className="text-xs text-muted-foreground">
              Spread across {regionsWithBlanks.length} Regions. Blank fields are left out of the Analysis.{" "}
              <button type="button" className="inline-flex items-center font-medium text-foreground" onClick={() => setByRegion((b) => !b)}>
                {byRegion ? "Hide" : "Show"} by Region <ChevronDown className={byRegion ? "size-3.5 rotate-180" : "size-3.5"} />
              </button>
            </p>
          )}
          {byRegion && (
            <div className="rounded-lg border">
              {regionsWithBlanks.map((r, i) => (
                <div key={r.region}>
                  {i > 0 && <Separator />}
                  <div className="flex h-11 items-center gap-2 px-3">
                    <span className="text-sm">{r.region}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{r.blank} unreached</span>
                    <Button variant="link" size="sm" className="w-[78px] text-xs" disabled={!r.onGoTo} onClick={r.onGoTo}>
                      Go to
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Block>

        {p.warnings.length > 0 && (
          <Block icon={<TriangleAlert className="size-4 text-warning" />} title="Unacknowledged warnings" count={String(p.warnings.length)}>
            {p.warnings.map((w) => (
              <div key={w.id} className="flex items-center gap-2 rounded-lg bg-warning-muted px-3 py-2">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{w.title}</span>
                  <span className="text-xs text-warning-muted-foreground">{w.detail}</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => p.onGoTo(w.id)}>
                  Review
                </Button>
              </div>
            ))}
          </Block>
        )}

        <p className="text-xs text-muted-foreground">
          {p.mode !== "skip" ? "Flags never block the Analysis. " : ""}
          Data dictionary v1.0 · {p.totals.recorded} recorded
          {p.mode !== "flag" && ` · ${p.totals.skipped} skipped`}
          {p.mode !== "skip" && ` · ${p.flagged.length} flagged`}
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => p.onOpenChange(false)}>
            Keep entering
          </Button>
          <Button autoFocus onClick={p.onRun}>
            <Play data-icon="inline-start" /> Run analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

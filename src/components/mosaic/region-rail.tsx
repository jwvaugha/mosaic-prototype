import { ChevronDown, ChevronRight, CircleX, EyeOff, Flag, ListOrdered, Plus, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Progress } from "./progress-bar"

// Library: Region Rail. Header (Regions · Edit order, totals, progress), then
// one row per Region: collapsed, expanded into its modality sections, or set
// aside. Only rows with an `onSelect` are interactive; the rest show the
// density of a real Workup.

export type RailModality = {
  label: string
  recorded: number
  total: number
  flagged?: number
  warnings?: number
  current?: boolean
  onSelect?: () => void
}

export type RailRegion = {
  name: string
  expanded: boolean
  setAside?: { kept: number }
  errors?: number
  warnings?: number
  flagged?: number
  modalities: RailModality[]
}

export function RegionRail({
  regions,
  totals,
  showFlags,
}: {
  regions: RailRegion[]
  totals: { recorded: number; total: number; skipped: number }
  showFlags: boolean
}) {
  return (
    <Sidebar className="top-14 h-[calc(100svh-3.5rem)] border-r" collapsible="none">
      <div className="flex flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          <div className="flex h-8 items-center">
            <span className="text-xs font-medium text-muted-foreground">Regions</span>
            <Button variant="ghost" size="sm" tabIndex={-1} className="ml-auto text-xs">
              <ListOrdered /> Edit order
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {totals.recorded} of {totals.total} recorded
            {totals.skipped > 0 && ` · ${totals.skipped} skipped`}
          </span>
          <Progress value={totals.total ? totals.recorded / totals.total : 0} />
        </div>

        <nav className="flex flex-col gap-1" aria-label="Regions">
          {regions.map((r) => (
            <RegionRow key={r.name} region={r} showFlags={showFlags} />
          ))}
        </nav>
      </div>
    </Sidebar>
  )
}

function RegionRow({ region: r, showFlags }: { region: RailRegion; showFlags: boolean }) {
  const recorded = r.modalities.reduce((a, m) => a + m.recorded, 0)
  const total = r.modalities.reduce((a, m) => a + m.total, 0)

  if (r.setAside) {
    return (
      <div className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground">
        <EyeOff className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{r.name}</span>
        <span className="shrink-0 text-xs">{r.setAside.kept} kept</span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
          <Plus className="size-3.5" /> add back
        </span>
      </div>
    )
  }

  const Chevron = r.expanded ? ChevronDown : ChevronRight
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-8 items-center gap-2 rounded-lg px-2">
        <Chevron className="size-4 shrink-0" />
        <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
        {!r.expanded && <IssueCounts errors={r.errors} warnings={r.warnings} flagged={showFlags ? r.flagged : 0} />}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {recorded} / {total}
        </span>
      </div>
      {r.expanded && (
        <div className="flex flex-col gap-1 pl-6">
          {r.modalities.map((m) => (
            <button
              key={m.label}
              type="button"
              tabIndex={-1}
              disabled={!m.onSelect}
              onClick={m.onSelect}
              className={cn(
                "relative flex h-7 items-center gap-2 rounded-lg px-2 text-left text-sm enabled:hover:bg-sidebar-accent",
                m.current && "bg-sidebar-accent font-medium",
              )}
            >
              {m.current && <span className="absolute top-1.5 left-0 h-4 w-[3px] rounded-sm bg-sidebar-primary" />}
              <span className="flex-1 truncate">{m.label}</span>
              <IssueCounts warnings={m.warnings} flagged={showFlags ? m.flagged : 0} />
              <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                {m.recorded} / {m.total}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function IssueCounts({ errors, warnings, flagged }: { errors?: number; warnings?: number; flagged?: number }) {
  return (
    <>
      {!!errors && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-destructive">
          <CircleX className="size-3.5" />
          {errors}
        </span>
      )}
      {!!warnings && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-warning-muted-foreground">
          <TriangleAlert className="size-3.5" />
          {warnings}
        </span>
      )}
      {!!flagged && <RailFlagCount count={flagged} />}
    </>
  )
}

// WF / Rail flag count in the wireframes: navy outline pill.
export function RailFlagCount({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} to come back to`}
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-primary px-1.5 text-xs font-medium text-primary"
    >
      <Flag className="size-3" />
      {count}
    </span>
  )
}

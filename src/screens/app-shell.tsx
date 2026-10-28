import { Flag, HardDrive } from "lucide-react"
import { toast } from "sonner"
import { RegionRail } from "@/components/mosaic/region-rail"
import { Button } from "@/components/ui/button"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useConfig } from "@/config/config-context"
import {
  adjacentSection,
  flaggedFields,
  railBadges,
  sectionCounts,
  sections,
} from "@/domain/workup"
import { useWorkup, WorkupProvider } from "@/workup/workup-context"
import { useWorkupKeyboard } from "@/workup/use-workup-keyboard"
import { SectionView } from "./section-view"

export function Prototype() {
  const { config } = useConfig()
  // Changing the policy or the seed starts a fresh Workup.
  return (
    <WorkupProvider key={`${config.incompletion}:${config.seed}`}>
      <AppShell />
    </WorkupProvider>
  )
}

function AppShell() {
  const { state, dispatch } = useWorkup()
  const { policy } = useConfig()
  const { onKeyDown } = useWorkupKeyboard()
  const badges = railBadges(state)
  const flags = flaggedFields(state).length

  const totals = { recorded: 0, total: 0, skipped: 0 }
  const railSections = sections.map((s) => {
    const c = sectionCounts(state, s.id)
    totals.recorded += c.recorded
    totals.total += c.total
    totals.skipped += c.skipped
    return {
      id: s.id,
      region: s.region,
      label: s.modality === "metric" ? "Metric" : "Morphological",
      recorded: c.recorded,
      total: c.total,
      flagged: badges[s.id].flagged,
      warnings: badges[s.id].warnings,
    }
  })

  // Placeholder until the section checks land (issue 07).
  const onContinue = () => {
    const next = adjacentSection(state.section, 1)
    if (next) dispatch({ type: "goToSection", section: next.id })
    else toast("The pre-Analysis check comes in step 7.")
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="z-20 flex h-14 shrink-0 items-center gap-6 border-b bg-background px-6">
        <span className="text-lg font-bold tracking-wide text-primary">MOSAIC</span>
        <span className="text-sm text-muted-foreground">
          Case <span className="font-medium text-foreground">MSUFAL016-26</span>
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <HardDrive className="size-3.5" /> Saved on this device
        </span>
        <Button className="relative" tabIndex={-1} onClick={onContinue}>
          Analyze
          {policy.analyzeBadge && flags > 0 && (
            <span className="absolute -top-2 -right-2 flex items-center gap-0.5 rounded-full border border-primary bg-background px-1.5 text-xs text-primary">
              <Flag className="size-3" />
              {flags}
            </span>
          )}
        </Button>
      </header>
      <SidebarProvider className="min-h-0 flex-1" style={{ "--sidebar-width": "280px" } as React.CSSProperties}>
        <RegionRail
          sections={railSections}
          current={state.section}
          showFlags={policy.allowFlag}
          totals={totals}
          onSelect={(id) => dispatch({ type: "goToSection", section: id })}
        />
        <main className="min-w-0 flex-1 overflow-y-auto px-10 pt-10" onKeyDown={onKeyDown}>
          <SectionView onContinue={onContinue} />
        </main>
      </SidebarProvider>
    </div>
  )
}

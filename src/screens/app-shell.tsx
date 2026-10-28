import { AppHeader } from "@/components/mosaic/app-header"
import { RegionRail, type RailRegion } from "@/components/mosaic/region-rail"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useConfig } from "@/config/config-context"
import { flaggedFields } from "@/domain/workup"
import { regionCounts } from "@/workup/chrome-counts"
import { useSectionFlow } from "@/workup/use-section-flow"
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
  const { onContinue, onAnalyze, dialogs } = useSectionFlow()
  const { regions, totals } = regionCounts(state)

  const rail: RailRegion[] = regions.map((r) => ({
    name: r.name,
    expanded: !!r.live,
    setAside: r.setAside,
    errors: r.errors,
    warnings: r.warnings,
    modalities: r.modalities.map((m) => ({
      ...m,
      current: "live" in m && m.live === state.section,
      onSelect: "live" in m ? () => dispatch({ type: "goToSection", section: m.live! }) : undefined,
    })),
  }))

  return (
    <div className="flex h-svh flex-col">
      <AppHeader flagBadge={policy.analyzeBadge ? flaggedFields(state).length : 0} onAnalyze={onAnalyze} />
      <SidebarProvider className="min-h-0 flex-1" style={{ "--sidebar-width": "280px" } as React.CSSProperties}>
        <RegionRail regions={rail} totals={totals} showFlags={policy.allowFlag} />
        <main className="min-w-0 flex-1 overflow-y-auto px-10 pt-8" onKeyDown={onKeyDown}>
          <SectionView onContinue={onContinue} />
        </main>
      </SidebarProvider>
      {dialogs}
    </div>
  )
}

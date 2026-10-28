import { useRef } from "react"
import { AppHeader } from "@/components/mosaic/app-header"
import { BottomDock, DOCK_HEIGHT, DockedColumn } from "@/components/mosaic/reference/presenters"
import { ReferenceMenu } from "@/components/mosaic/reference/reference-menu"
import { RegionRail, type RailRegion } from "@/components/mosaic/region-rail"
import { TestModePanel } from "@/components/mosaic/test-mode-panel"
import { logEvent } from "@/lib/event-log"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useConfig } from "@/config/config-context"
import { flaggedFields } from "@/domain/workup"
import { regionCounts } from "@/workup/chrome-counts"
import { useReference } from "@/workup/use-reference"
import { useScrollAnchor } from "@/workup/use-scroll-anchor"
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
  const { policy, config, setConfig } = useConfig()
  const { onKeyDown } = useWorkupKeyboard()
  const ref = useReference()
  const dock = ref.data && ref.layout === "D"
  const inline = !!ref.data && ref.layout === "C"
  const mainRef = useRef<HTMLElement>(null)
  useScrollAnchor(mainRef, state.focus?.kind === "field" ? state.focus.id : null, state.section, inline)
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
    <div
      className="flex h-svh flex-col"
      onClickCapture={(e) => {
        const t = (e.target as HTMLElement).closest("button, [role=radio], input")
        if (t) logEvent({ kind: "click", name: t.textContent?.trim().slice(0, 40) || t.tagName, mode: policy.id })
      }}
    >
      <AppHeader
        flagBadge={policy.analyzeBadge ? flaggedFields(state).length : 0}
        onAnalyze={onAnalyze}
        referenceMenu={
          <ReferenceMenu autoShow={config.autoShow} onChange={(autoShow) => setConfig((c) => ({ ...c, autoShow }))} />
        }
      />
      <SidebarProvider className="min-h-0 flex-1" style={{ "--sidebar-width": "280px" } as React.CSSProperties}>
        <RegionRail regions={rail} totals={totals} showFlags={policy.allowFlag} />
        <div className="relative flex min-w-0 flex-1" onKeyDown={onKeyDown}>
          <main
            ref={mainRef}
            className="min-w-0 flex-1 overflow-y-auto px-10 pt-8"
            // With the bottom dock, keep the focused row scrolled above it.
            style={
              dock
                ? { paddingBottom: DOCK_HEIGHT, scrollPaddingBottom: DOCK_HEIGHT + 16 }
                : inline
                  ? // Room to scroll, so the last rows can stay put too.
                    { paddingBottom: "60vh" }
                  : undefined
            }
          >
            <SectionView onContinue={onContinue} inlineReference={inline ? ref : null} />
          </main>
          {dock && <BottomDock data={ref.data!} onClose={ref.close} />}
        </div>
        {ref.data && ref.layout === "A" && <DockedColumn data={ref.data} onClose={ref.close} />}
      </SidebarProvider>
      {dialogs}
      <TestModePanel
        fieldSummary={`This Workup: ${totals.recorded} recorded · ${totals.skipped} skipped · ${flaggedFields(state).length} flagged (of ${totals.total}).`}
      />
    </div>
  )
}

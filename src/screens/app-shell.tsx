import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { AppHeader } from "@/components/mosaic/app-header"
import { BottomDock, DOCK_HEIGHT, DockedColumn } from "@/components/mosaic/reference/presenters"
import { ReferenceMenu } from "@/components/mosaic/reference/reference-menu"
import { RegionRail, type RailRegion } from "@/components/mosaic/region-rail"
import { TestModePanel } from "@/components/mosaic/test-mode-panel"
import { logEvent } from "@/lib/event-log"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useConfig } from "@/config/config-context"
import { fieldIds, flaggedFields, sectionOf } from "@/domain/workup"
import { regionCounts } from "@/workup/chrome-counts"
import { RailProvider, useRail } from "@/workup/rail-context"
import { useReference } from "@/workup/use-reference"
import { useScrollAnchor } from "@/workup/use-scroll-anchor"
import { useSectionFlow } from "@/workup/use-section-flow"
import { useWorkup, WorkupProvider } from "@/workup/workup-context"
import { useWorkupKeyboard } from "@/workup/use-workup-keyboard"
import { SectionView } from "./section-view"

// First visit: point testers at the guide, once.
function useGuidePrompt() {
  useEffect(() => {
    const KEY = "mosaic-proto:guide-prompted"
    try {
      if (localStorage.getItem(KEY)) return
      localStorage.setItem(KEY, "1")
    } catch {
      return
    }
    toast("New here? The testing guide takes 3 minutes to read.", {
      duration: 15000,
      position: "top-center",
      action: { label: "Open the guide", onClick: () => (window.location.hash = "#/guide") },
    })
  }, [])
}

export function Prototype() {
  useGuidePrompt()
  const { config, resetKey } = useConfig()
  // Changing the policy, the scenario or the opening section starts a fresh
  // Workup, as does "Start again" in Test mode.
  return (
    <WorkupProvider key={`${config.incompletion}:${config.seed}:${config.start}:${resetKey}`}>
      <RailProvider>
        <AppShell />
      </RailProvider>
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
  const railState = useRail()
  const { rail, sectionOrder } = railState
  const { regions, totals } = regionCounts(state, rail)
  const currentRegion = sectionOf(fieldIds(state.section)[0]).region

  // Opening a section opens its Region in the rail.
  const { toggle } = railState
  useEffect(() => toggle(currentRegion, true), [currentRegion, toggle])

  const railRegions: RailRegion[] = regions.map((r) => ({
    name: r.name,
    membership: r.membership,
    kept: r.kept,
    expanded: rail.expanded.has(r.name),
    // Keep at least one enterable Region in the Workup.
    removable: !sectionOrder.every((id) => sectionOf(fieldIds(id)[0]).region === r.name),
    errors: r.errors,
    warnings: r.warnings,
    modalities: r.modalities.map((m) => ({
      ...m,
      current: "live" in m && m.live === state.section,
      onSelect: "live" in m ? () => dispatch({ type: "goToSection", section: m.live! }) : undefined,
    })),
  }))

  const removeRegion = (name: string, kept: number) => {
    railState.remove(name, kept)
    logEvent({ kind: "action", name: kept ? "setAsideRegion" : "removeRegion", mode: policy.id })
    // Leaving the open Region moves on to the next one still in the Workup.
    if (name !== currentRegion) return
    const left = sectionOrder.filter((id) => sectionOf(fieldIds(id)[0]).region !== name)
    const i = sectionOrder.indexOf(state.section)
    const next = sectionOrder.slice(i + 1).find((id) => left.includes(id)) ?? left[0]
    if (next) dispatch({ type: "goToSection", section: next })
  }

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
        <RegionRail
          regions={railRegions}
          totals={totals}
          showFlags={policy.allowFlag}
          mode={rail.mode}
          savedDefault={rail.savedDefault}
          onToggle={railState.toggle}
          onAdd={(name) => {
            railState.add(name)
            logEvent({ kind: "action", name: "addRegion", mode: policy.id })
          }}
          onRemove={removeRegion}
          onMove={railState.move}
          onModeChange={railState.setMode}
          onSaveDefault={railState.saveDefault}
          onResetOrder={railState.resetOrder}
          onUnavailable={(title) => toast(`${title} is display-only in this prototype.`)}
        />
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

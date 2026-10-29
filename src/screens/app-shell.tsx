import { useEffect, useRef, useState } from "react"
import { useMediaQuery } from "@/lib/use-media-query"
import { toast } from "sonner"
import { AppHeader, SubFooter, WorkupFooter } from "@/components/mosaic/app-header"
import { BottomDock, DOCK_HEIGHT, DOCK_STRIP_HEIGHT, DockedColumn, DockStrip } from "@/components/mosaic/reference/presenters"
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

export function Prototype() {
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
  const { policy } = useConfig()
  const { onKeyDown } = useWorkupKeyboard()
  const ref = useReference()
  // Bottom dock: open, or collapsed to a thin strip. Inline: only under a field.
  const dockLayout = ref.layout === "B"
  const dock = dockLayout && ref.open
  const inline = ref.open && !!ref.data && ref.layout === "C"
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

  // The rail collapses to a strip of Region codes. Below 1024 px it starts
  // collapsed and, when opened, floats over the content; the choice is
  // remembered on wider screens.
  const narrow = useMediaQuery("(max-width: 1023px)")
  const [railPref, setRailPref] = useState(() => {
    try {
      return localStorage.getItem("mosaic-proto:rail-collapsed") === "1"
    } catch {
      return false
    }
  })
  const [overlayOpen, setOverlayOpen] = useState(false)
  const railCollapsed = narrow ? !overlayOpen : railPref
  const setRailCollapsed = (c: boolean) => {
    if (narrow) return setOverlayOpen(!c)
    setRailPref(c)
    try {
      localStorage.setItem("mosaic-proto:rail-collapsed", c ? "1" : "0")
    } catch {
      // ignore
    }
  }
  // Choosing a section closes the floating rail.
  useEffect(() => setOverlayOpen(false), [state.section, narrow])

  return (
    <div
      className="flex h-svh flex-col"
      onClickCapture={(e) => {
        const t = (e.target as HTMLElement).closest("button, [role=radio], input")
        if (t) logEvent({ kind: "click", name: t.textContent?.trim().slice(0, 40) || t.tagName, mode: policy.id })
      }}
    >
      <AppHeader />
      <SidebarProvider className="relative min-h-0 flex-1" style={{ "--sidebar-width": "280px" } as React.CSSProperties}>
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
          collapsed={railCollapsed}
          overlay={narrow}
          onCollapse={setRailCollapsed}
        />
        <div className="relative flex min-w-0 flex-1" onKeyDown={onKeyDown}>
          <main
            ref={mainRef}
            className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-6 md:px-6 lg:px-10 lg:pt-8"
            // With the bottom dock, keep the focused row scrolled above it.
            style={
              dock
                ? { paddingBottom: DOCK_HEIGHT, scrollPaddingBottom: DOCK_HEIGHT + 16 }
                : dockLayout
                  ? { paddingBottom: DOCK_STRIP_HEIGHT + 24, scrollPaddingBottom: DOCK_STRIP_HEIGHT + 16 }
                  : inline
                  ? // Room to scroll, so the last rows can stay put too.
                    { paddingBottom: "60vh" }
                  : undefined
            }
          >
            <SectionView
              onContinue={onContinue}
              inlineReference={inline ? ref : null}
              // Every layout switches the panel from the sticky section header
              // (the bottom dock keeps its strip too). Inline and bottom dock
              // show "Hide reference" while on; docked drops the button.
              referenceToggle={{ open: ref.open, onToggle: ref.toggle, hideWhenOpen: ref.layout === "A" }}
            />
          </main>
          {dockLayout && (dock ? <BottomDock data={ref.data} onClose={ref.close} /> : <DockStrip onOpen={ref.toggle} />)}
        </div>
        {ref.open && ref.layout === "A" && <DockedColumn data={ref.data} onClose={ref.close} />}
      </SidebarProvider>
      <WorkupFooter flagBadge={policy.analyzeBadge ? flaggedFields(state).length : 0} onAnalyze={onAnalyze} />
      <SubFooter>
        <TestModePanel
          fieldSummary={`This Workup: ${totals.recorded} recorded · ${totals.skipped} skipped · ${flaggedFields(state).length} flagged (of ${totals.total}).`}
        />
        <span className="hidden sm:inline">Prototype for testing · not part of MOSAIC</span>
        <a href="#/guide" className="ml-auto hover:text-foreground hover:underline">
          Tester guide
        </a>
      </SubFooter>
      {dialogs}
    </div>
  )
}

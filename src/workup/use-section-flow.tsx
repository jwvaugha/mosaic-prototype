import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { PreAnalysisDialog } from "@/components/mosaic/pre-analysis-dialog"
import { FlagCheckDialog, SkipCheckDialog } from "@/components/mosaic/section-check-dialog"
import { showUndoToast } from "@/components/mosaic/undo-toast"
import { useConfig } from "@/config/config-context"
import {
  adjacentSection,
  blankFields,
  sections,
  variable,
  warningFields,
  type WorkupState,
} from "@/domain/workup"
import { logEvent } from "@/lib/event-log"
import { flaggedItems, regionCounts, whereOf } from "./chrome-counts"
import { useWorkup } from "./workup-context"

// What Continue and Analyze do under each policy (Flows page):
//   1   blanks → "Skip N and continue" check, then an Undo toast
//   2   flags  → list them, "Stay" or "Continue"
//   2.5 no check; flags are collected in the pre-Analysis check
// The last section's Continue and the header's Analyze open the pre-Analysis
// check.

export function useSectionFlow() {
  const { state, dispatch } = useWorkup()
  const { policy } = useConfig()
  const [dialog, setDialog] = useState<null | "skip" | "flags" | "analysis">(null)
  const undo = useRef<WorkupState | null>(null)

  const section = sections.find((s) => s.id === state.section)!
  const next = adjacentSection(section.id, 1)
  const blanks = blankFields(state, section.id)
  const sectionFlags = flaggedItems(state, section.id)

  const open = (d: typeof dialog) => {
    if (d) logEvent({ kind: "dialog", name: d, mode: policy.id })
    setDialog(d)
  }
  const goTo = (id: string) => {
    setDialog(null)
    const s = sections.find((x) => x.bones.some((b) => b.variableIds.includes(id)))!
    dispatch({ type: "goToSection", section: s.id, focus: { kind: "field", id } })
  }
  const moveOn = () => {
    setDialog(null)
    if (next) dispatch({ type: "goToSection", section: next.id })
    else open("analysis")
  }

  const onContinue = () => {
    if (policy.sectionCheck === "blanks" && blanks.length) return open("skip")
    if (policy.sectionCheck === "flags" && sectionFlags.length && next) return open("flags")
    moveOn()
  }

  const skipAll = () => {
    undo.current = state
    const n = blanks.length
    dispatch({ type: "skipBlanks", section: section.id })
    moveOn()
    showUndoToast(`${n} blank ${n === 1 ? "field" : "fields"} in ${section.title} marked Skipped`, () => {
      if (undo.current) dispatch({ type: "restore", state: undo.current })
      undo.current = null
    })
  }

  // ⌘Z / Ctrl+Z undoes the last "Skip N and continue".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "z" || !(e.metaKey || e.ctrlKey) || !undo.current) return
      if (e.target instanceof HTMLInputElement && e.target.value) return
      e.preventDefault()
      dispatch({ type: "restore", state: undo.current })
      undo.current = null
      toast.dismiss()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dispatch])

  const { regions, totals } = regionCounts(state)

  const dialogs = (
    <>
      <SkipCheckDialog
        open={dialog === "skip"}
        sectionTitle={section.title}
        blankNames={blanks.map((id) => variable(id).name)}
        onGoToFirst={() => blanks[0] && goTo(blanks[0])}
        onSkipAll={skipAll}
        onClose={() => setDialog(null)}
      />
      {next && (
        <FlagCheckDialog
          open={dialog === "flags"}
          sectionTitle={section.title}
          nextTitle={next.title}
          flagged={sectionFlags}
          otherBlank={blanks.length - sectionFlags.filter((f) => state.fields[f.id].value === null).length}
          onGoTo={goTo}
          onStay={() => setDialog(null)}
          onContinue={moveOn}
        />
      )}
      <PreAnalysisDialog
        open={dialog === "analysis"}
        onOpenChange={(o) => setDialog(o ? "analysis" : null)}
        mode={policy.allowFlag ? "flag" : "skip"}
        flagged={flaggedItems(state)}
        warnings={warningFields(state).map((id) => {
          const v = variable(id)
          return {
            id,
            title: `${v.name}  ·  ${whereOf(id)}`,
            detail: `Outside the usual range (${v.range?.min}–${v.range?.max} ${v.unit}).`,
          }
        })}
        blankByRegion={regions
          .filter((r) => !r.setAside)
          .map((r) => ({
            region: r.name,
            blank: r.blank,
            onGoTo: r.live ? () => (setDialog(null), dispatch({ type: "goToSection", section: r.live! })) : undefined,
          }))}
        totals={totals}
        onGoTo={goTo}
        onRun={() => {
          logEvent({ kind: "action", name: "runAnalysis", mode: policy.id })
          setDialog(null)
          toast("Analysis submitted. The prototype stops here.")
        }}
      />
    </>
  )

  return { onContinue, onAnalyze: () => open("analysis"), dialogs }
}

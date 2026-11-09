import { useEffect, type KeyboardEvent } from "react"
import { useConfig } from "@/config/config-context"
import {
  adjacentSection,
  nextField,
  nextTabTarget,
  reducer,
  referenceVisible,
  sectionOf,
  variable,
  type Focus,
} from "@/domain/workup"
import { showUndoToast } from "@/components/mosaic/undo-toast"
import { logEvent } from "@/lib/event-log"
import { useRail } from "./rail-context"
import { usePreview } from "./preview-context"
import { useWorkup } from "./workup-context"

// All data-entry keys in one place (spec: Keyboard controller). What each key
// does depends only on the policy's flags:
//
//   Tab / ⇧Tab     next / previous stop; Tab passes over Skipped rows
//   ↑ / ↓          previous / next field (Skipped ones too), from any stop
//   0–9            Morph: select that Character state, then advance
//   ←/→            Morph: move between states (previewed in the reference)
//   Enter          Metric: commit and advance; Morph: pick the state in focus
//                  (the first, on arriving), then advance
//   ⌫ / Delete     clear a Morph score, or un-Skip a field
//   - / ⇧-         Skip / un-Skip the field, Skip the bone   (allowSkip)
//   ⌥F             toggle "come back to", advancing when set   (allowFlag)
//   R / ?          show or hide the reference panel (one switch)
//   N              open the field's note
//   Esc            close the reference
//   ⌃⌥↓ / ⌃⌥↑      next / previous section (anywhere)
//
// Keys are matched by event.code where layouts differ: ⇧- types "_" on US
// keyboards and ⌥F types "ƒ" on macOS.

export function useWorkupKeyboard() {
  const { state, dispatch } = useWorkup()
  const { policy } = useConfig()
  const { preview } = usePreview()
  const { sectionOrder } = useRail()
  const mode = policy.id

  const log = (name: string, field?: string) => logEvent({ kind: "key", name, field, mode })

  const move = (from: Focus, dir: 1 | -1) => {
    const to = nextTabTarget(state, from, dir)
    if (to) dispatch({ type: "focus", focus: to })
    return to
  }

  // Section shortcuts work from anywhere on the page.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.ctrlKey && e.altKey) || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return
      e.preventDefault()
      const next = adjacentSection(state.section, e.key === "ArrowDown" ? 1 : -1, sectionOrder)
      log(e.key === "ArrowDown" ? "⌃⌥↓" : "⌃⌥↑")
      if (next) dispatch({ type: "goToSection", section: next.id })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // ↑ / ↓ are taken in the capture phase, before the state and chip groups
  // own arrow-key handling (Radix moves between items on every arrow) and
  // before a Metric input moves its caret. Text areas, menus and dialogs
  // (the note editor, the ⋯ menu) keep their arrows.
  const onKeyDownCapture = (e: KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    const t = e.target as HTMLElement
    if (t.closest("textarea, [role=dialog], [role=menu], [role=listbox], [data-slot=popover-content]")) return
    const focus = state.focus
    if (!focus) return
    const to = nextField(state, focus, e.key === "ArrowDown" ? 1 : -1)
    e.preventDefault()
    e.stopPropagation()
    if (!to) return
    log(e.key === "ArrowDown" ? "↓" : "↑", focus.kind === "field" ? focus.id : undefined)
    dispatch({ type: "focus", focus: to })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const focus = state.focus
    const fieldId = focus?.kind === "field" ? focus.id : null
    const v = fieldId ? variable(fieldId) : null

    if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (!focus) return
      const to = move(focus, e.shiftKey ? -1 : 1)
      if (to) {
        e.preventDefault()
        log(e.shiftKey ? "⇧Tab" : "Tab", fieldId ?? undefined)
      }
      return
    }

    const refShown = referenceVisible(state)

    if (e.key === "Escape" && !state.firstUseHintSeen && focus?.kind === "field") {
      e.preventDefault()
      log("Esc")
      dispatch({ type: "dismissHint" })
      return
    }

    if (e.key === "Escape" && refShown) {
      e.preventDefault()
      log("Esc")
      dispatch({ type: "closeReference" })
      return
    }

    // On a bone header: − (or ⇧−) Skips the bone's blanks; Enter moves on.
    // ←/→ for Side are handled by the header itself.
    if (focus?.kind === "bone" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.code === "Minus" || e.key === "-" || e.key === "_") {
        e.preventDefault()
        if (!policy.allowSkip) return
        log("-", `bone:${focus.id}`)
        dispatch({ type: "toggleSkipBone", boneId: focus.id })
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        move(focus, 1)
        return
      }
    }
    if (focus?.kind === "conditions" && e.key === "Enter") {
      e.preventDefault()
      move(focus, 1)
      return
    }

    if (!fieldId || !v) return

    // R (or ?) opens or closes the reference for the field. R is never part of
    // a value (measurements are numbers, states are numeric codes).
    if (e.key === "?" || ((e.key === "r" || e.key === "R") && !e.altKey && !e.ctrlKey && !e.metaKey)) {
      e.preventDefault()
      log(e.key === "?" ? "?" : "R", fieldId)
      dispatch({ type: "toggleReference" })
      return
    }

    // By code for ⇧- ("_" on US layouts); by key for layouts that put the dash
    // elsewhere (German: the Slash key).
    const isDash = e.code === "Minus" || e.key === "-" || e.key === "_"
    if (isDash && !e.altKey && !e.ctrlKey && !e.metaKey) {
      // No value ever contains a dash, so a dash is never typed into a field.
      e.preventDefault()
      if (!policy.allowSkip) return
      if (e.shiftKey) {
        log("⇧-", fieldId)
        const bone = sectionOf(fieldId).bones.find((b) => b.variableIds.includes(fieldId))!
        dispatch({ type: "toggleSkipBone", boneId: bone.id })
        return
      }
      const f = state.fields[fieldId]
      const draft = e.target instanceof HTMLInputElement ? e.target.value.trim() : ""
      const had = f.value ?? (draft || null)
      log("-", fieldId)
      if (had !== null) {
        // Skipping a scored field drops its value, so offer to put it back.
        // Undo brings back what was there, including an uncommitted draft.
        const before = f.value === null ? reducer(state, { type: "enter", id: fieldId, value: draft }) : state
        dispatch({ type: "toggleSkip", id: fieldId })
        showUndoToast(`Skipped ${v.name}; cleared ${had}${v.unit ? ` ${v.unit}` : ""}`, () =>
          dispatch({ type: "restore", state: before }),
        )
      } else dispatch({ type: "toggleSkip", id: fieldId })
      // Skipping moves on; un-Skipping stays put so the field can be scored.
      if (!f.skipped) move(focus, 1)
      return
    }

    // Backspace / Delete clear a Morphological score, or un-Skip a field.
    // In a Metric input they edit the text as usual; an emptied input clears
    // the value when the field is left.
    if ((e.key === "Backspace" || e.key === "Delete") && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.target instanceof HTMLInputElement) return
      const f = state.fields[fieldId]
      if (f.value === null && !f.skipped) return
      e.preventDefault()
      log(e.key === "Delete" ? "Delete" : "⌫", fieldId)
      dispatch({ type: "clear", id: fieldId })
      return
    }

    // N opens the field's note (never part of a value).
    if ((e.key === "n" || e.key === "N") && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      log("N", fieldId)
      dispatch({ type: "openNote", id: fieldId })
      return
    }

    if (e.code === "KeyF" && e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (!policy.allowFlag) return
      log("⌥F", fieldId)
      const setting = !state.fields[fieldId].flag
      dispatch({ type: "toggleFlag", id: fieldId })
      // Marking moves on, as Skip does; unmarking stays put.
      if (setting) move(focus, 1)
      return
    }

    if (e.key === "Enter" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      log("Enter", fieldId)
      // On a Morph field, Enter scores the state in focus: the first one on
      // arriving (or the chosen one), or wherever ←/→ moved to. Space
      // (the button's own key) marks it too, without moving on.
      if (v.modality === "morph") {
        const inFocus = (e.target as HTMLElement).closest<HTMLElement>("[data-code]")?.dataset.code
        const code = inFocus ?? (preview?.id === fieldId && preview.source === "focus" ? preview.code : undefined)
        if (code && code !== state.fields[fieldId].value) dispatch({ type: "enter", id: fieldId, value: code })
      }
      // Moving focus blurs a Metric input, which commits its draft.
      move(focus, 1)
      return
    }

    if (v.modality === "morph" && /^[0-9]$/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (!v.states?.some((s) => s.code === e.key)) return
      log(e.key, fieldId)
      dispatch({ type: "enter", id: fieldId, value: e.key })
      move(focus, 1)
    }
  }

  return { onKeyDown, onKeyDownCapture }
}

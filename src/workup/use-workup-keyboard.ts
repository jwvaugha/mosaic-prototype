import { useEffect, type KeyboardEvent } from "react"
import { useConfig } from "@/config/config-context"
import { adjacentSection, nextTabTarget, referenceVisible, sectionOf, variable, type Focus } from "@/domain/workup"
import { logEvent } from "@/lib/event-log"
import { useWorkup } from "./workup-context"

// All data-entry keys in one place (spec: Keyboard controller). What each key
// does depends only on the policy's flags:
//
//   Tab / ⇧Tab     next / previous stop; Tab passes over Skipped rows
//   0–9            Morph: select that Character state, then advance
//   Enter          Metric: commit and advance; Morph: advance
//   - / ⇧-         Skip / un-Skip the field, Skip the bone   (allowSkip)
//   ⌥F             toggle "come back to"                     (allowFlag)
//   ?              open or close the reference for the field
//   Esc            close the reference
//   ⌃⌥↓ / ⌃⌥↑      next / previous section (anywhere)
//
// Keys are matched by event.code where layouts differ: ⇧- types "_" on US
// keyboards and ⌥F types "ƒ" on macOS.

export function useWorkupKeyboard() {
  const { state, dispatch } = useWorkup()
  const { policy, config } = useConfig()
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
      const next = adjacentSection(state.section, e.key === "ArrowDown" ? 1 : -1)
      log(e.key === "ArrowDown" ? "⌃⌥↓" : "⌃⌥↑")
      if (next) dispatch({ type: "goToSection", section: next.id })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

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

    const refShown = referenceVisible(state, config.autoShow)

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

    if (!fieldId || !v) return

    if (e.key === "?") {
      e.preventDefault()
      log("?", fieldId)
      dispatch(refShown ? { type: "closeReference" } : { type: "openReference" })
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
      if (f.value !== null || draft !== "") return
      log("-", fieldId)
      dispatch({ type: "toggleSkip", id: fieldId })
      // Skipping moves on; un-Skipping stays put so the field can be scored.
      if (!f.skipped) move(focus, 1)
      return
    }

    if (e.code === "KeyF" && e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (!policy.allowFlag) return
      log("⌥F", fieldId)
      dispatch({ type: "toggleFlag", id: fieldId })
      return
    }

    if (e.key === "Enter" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      log("Enter", fieldId)
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

  return { onKeyDown }
}

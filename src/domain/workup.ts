// Workup state: a pure reducer and selectors, no React. Terms follow
// CONTEXT.md: a field is Unreached (blank), Recorded, Warning (out of range),
// Acknowledged (warning accepted) or Skipped. A "come back to" flag sits on top
// of any of these and never reaches the model.

import { fixture } from "@/data"
import { SEEDS, type SeedId } from "@/data/seeds"
import type { Section, Variable } from "@/data/types"

export type FieldStatus = "unreached" | "recorded" | "warning" | "acknowledged" | "skipped"

export type FlagReason = "re-measure" | "bone-elsewhere" | "ask-colleague" | "other"

export const FLAG_REASONS: Record<FlagReason, string> = {
  "re-measure": "Re-measure",
  "bone-elsewhere": "Bone in use elsewhere",
  "ask-colleague": "Ask a colleague",
  other: "Other",
}

export type FieldState = {
  value: string | null
  skipped: boolean
  acknowledged: boolean
  flag: { reason?: FlagReason } | null
}

export type Focus =
  | { kind: "field"; id: string }
  | { kind: "continue"; section: string }
  | null

export type WorkupState = {
  fields: Record<string, FieldState>
  section: string
  focus: Focus
  // `open`: opened by hand (button, ?); it then follows focus until closed.
  // `dismissedFor`: the field it was closed on. Auto-show stays off for that
  // field only and comes back on the next one.
  reference: { open: boolean; dismissedFor: string | null }
  firstUseHintSeen: boolean
}

export type Action =
  | { type: "enter"; id: string; value: string }
  | { type: "clear"; id: string }
  | { type: "toggleSkip"; id: string }
  | { type: "toggleSkipBone"; boneId: string }
  | { type: "skipBlanks"; section: string }
  | { type: "toggleFlag"; id: string }
  | { type: "setFlagReason"; id: string; reason: FlagReason | undefined }
  | { type: "acknowledge"; id: string }
  | { type: "unacknowledge"; id: string }
  | { type: "focus"; focus: Focus }
  | { type: "goToSection"; section: string; focus?: Focus }
  | { type: "openReference" }
  | { type: "closeReference" }
  | { type: "dismissHint" }
  | { type: "load"; seed: SeedId }
  // Undo for "Skip N and continue": puts back a snapshot.
  | { type: "restore"; state: WorkupState }

// ---------------------------------------------------------------------------
// Fixture lookups

export const sections: Section[] = fixture.sections

export function variable(id: string): Variable {
  return fixture.variables[id]
}

export function sectionOf(id: string): Section {
  return sections.find((s) => s.bones.some((b) => b.variableIds.includes(id)))!
}

export function fieldIds(sectionId: string): string[] {
  const s = sections.find((x) => x.id === sectionId)
  return s ? s.bones.flatMap((b) => b.variableIds) : []
}

function boneFields(boneId: string): string[] {
  for (const s of sections) {
    const bone = s.bones.find((b) => b.id === boneId)
    if (bone) return bone.variableIds
  }
  return []
}

// `order` is the enterable sections in rail order (Edit order, Regions left
// out of the Workup); it defaults to the fixture's order.
export function adjacentSection(
  sectionId: string,
  dir: 1 | -1,
  order: string[] = sections.map((s) => s.id),
): Section | null {
  const i = order.indexOf(sectionId)
  // From a section that just left the Workup, "next" is the first one left.
  const id = i === -1 ? (dir === 1 ? order[0] : order.at(-1)) : order[i + dir]
  return sections.find((s) => s.id === id) ?? null
}

// ---------------------------------------------------------------------------
// Field status

export function isValidValue(v: Variable, value: string): boolean {
  if (v.modality === "morph") return !!v.states?.some((s) => s.code === value)
  return value.trim() !== "" && Number.isFinite(Number(value))
}

export function isOutOfRange(v: Variable, value: string): boolean {
  if (v.modality !== "metric" || !v.range) return false
  const n = Number(value)
  return n < v.range.min || n > v.range.max
}

export function fieldStatus(state: WorkupState, id: string): FieldStatus {
  const f = state.fields[id]
  if (f.value === null) return f.skipped ? "skipped" : "unreached"
  if (isOutOfRange(variable(id), f.value)) return f.acknowledged ? "acknowledged" : "warning"
  return "recorded"
}

// ---------------------------------------------------------------------------
// Initial state and reducer

const emptyField = (): FieldState => ({ value: null, skipped: false, acknowledged: false, flag: null })

export function initialState(seed: SeedId = "fresh", start?: string): WorkupState {
  const s = SEEDS[seed]
  const fields: Record<string, FieldState> = {}
  for (const id of Object.keys(fixture.variables)) {
    const value = s.values[id] ?? null
    fields[id] = { ...emptyField(), value, acknowledged: s.acknowledged.includes(id) }
  }
  const first = sections.find((x) => x.id === start) ?? sections[0]
  const state: WorkupState = {
    fields,
    section: first.id,
    focus: null,
    reference: { open: false, dismissedFor: null },
    firstUseHintSeen: false,
  }
  // A Workup opens on its first blank field, like any section.
  return { ...state, focus: landingFocus(state, first.id) }
}

function patch(state: WorkupState, id: string, p: Partial<FieldState>): WorkupState {
  return { ...state, fields: { ...state.fields, [id]: { ...state.fields[id], ...p } } }
}

// Marking any field or moving to another section counts as having seen it.
const MARKS_FIELD = new Set(["enter", "toggleSkip", "toggleSkipBone", "toggleFlag", "skipBlanks", "goToSection"])

export function reducer(state: WorkupState, action: Action): WorkupState {
  const next = reduce(state, action)
  return MARKS_FIELD.has(action.type) && !next.firstUseHintSeen && next !== state
    ? { ...next, firstUseHintSeen: true }
    : next
}

function reduce(state: WorkupState, action: Action): WorkupState {
  switch (action.type) {
    case "enter": {
      const v = variable(action.id)
      const value = action.value.trim()
      if (value === "") return patch(state, action.id, { value: null, acknowledged: false })
      if (!isValidValue(v, value)) return state
      // A new value un-Skips the field and needs a fresh acknowledgement.
      // It does not clear a "come back to" flag (proposed on the Flows page).
      const same = state.fields[action.id].value === value
      return patch(state, action.id, {
        value,
        skipped: false,
        acknowledged: same ? state.fields[action.id].acknowledged : false,
      })
    }
    case "clear":
      // Back to blank: no value, not Skipped.
      return patch(state, action.id, { value: null, skipped: false, acknowledged: false })
    case "toggleSkip": {
      const f = state.fields[action.id]
      // Skipping a scored field clears its value (the keyboard offers Undo).
      if (f.value !== null) return patch(state, action.id, { value: null, skipped: true, acknowledged: false })
      return patch(state, action.id, { skipped: !f.skipped })
    }
    case "toggleSkipBone": {
      const blanks = boneFields(action.boneId).filter((id) => state.fields[id].value === null)
      const allSkipped = blanks.length > 0 && blanks.every((id) => state.fields[id].skipped)
      let next = state
      for (const id of blanks) next = patch(next, id, { skipped: !allSkipped })
      return next
    }
    case "skipBlanks": {
      let next = state
      for (const id of fieldIds(action.section)) {
        const f = state.fields[id]
        if (f.value === null && !f.skipped) next = patch(next, id, { skipped: true })
      }
      return next
    }
    case "toggleFlag": {
      const f = state.fields[action.id]
      return patch(state, action.id, { flag: f.flag ? null : {} })
    }
    case "setFlagReason":
      return patch(state, action.id, { flag: { reason: action.reason } })
    case "acknowledge":
      return patch(state, action.id, { acknowledged: true })
    case "unacknowledge":
      return patch(state, action.id, { acknowledged: false })
    case "focus": {
      const f = action.focus
      const section = f?.kind === "field" ? sectionOf(f.id).id : f?.kind === "continue" ? f.section : state.section
      return { ...state, focus: f, section }
    }
    case "goToSection": {
      const focus = action.focus ?? landingFocus(state, action.section)
      return { ...state, section: action.section, focus }
    }
    case "openReference":
      return { ...state, reference: { open: true, dismissedFor: null } }
    case "closeReference":
      return {
        ...state,
        reference: { open: false, dismissedFor: state.focus?.kind === "field" ? state.focus.id : null },
      }
    case "dismissHint":
      return { ...state, firstUseHintSeen: true }
    case "load":
      return initialState(action.seed, state.section)
    case "restore":
      return action.state
  }
}

// ---------------------------------------------------------------------------
// Selectors

export type SectionCounts = {
  total: number
  recorded: number // has a value, including warnings
  blank: number // Unreached and not Skipped
  skipped: number
  flagged: number
  warnings: number // unacknowledged
}

export function sectionCounts(state: WorkupState, sectionId: string): SectionCounts {
  const c: SectionCounts = { total: 0, recorded: 0, blank: 0, skipped: 0, flagged: 0, warnings: 0 }
  for (const id of fieldIds(sectionId)) {
    const status = fieldStatus(state, id)
    c.total++
    if (status === "unreached") c.blank++
    else if (status === "skipped") c.skipped++
    else c.recorded++
    if (status === "warning") c.warnings++
    if (state.fields[id].flag) c.flagged++
  }
  return c
}

export function blankFields(state: WorkupState, sectionId: string): string[] {
  return fieldIds(sectionId).filter((id) => fieldStatus(state, id) === "unreached")
}

export function flaggedFields(state: WorkupState, sectionId?: string): string[] {
  const ids = sectionId ? fieldIds(sectionId) : sections.flatMap((s) => fieldIds(s.id))
  return ids.filter((id) => state.fields[id].flag)
}

export function warningFields(state: WorkupState): string[] {
  return sections.flatMap((s) => fieldIds(s.id)).filter((id) => fieldStatus(state, id) === "warning")
}

export function firstBlankIn(state: WorkupState, sectionId: string): string | null {
  return blankFields(state, sectionId)[0] ?? null
}

// Where focus lands when a section opens: its first blank field, else its
// Continue footer.
export function landingFocus(state: WorkupState, sectionId: string): Focus {
  const id = firstBlankIn(state, sectionId)
  return id ? { kind: "field", id } : { kind: "continue", section: sectionId }
}

// Tab order within a section: fields in fixture order, then the Continue
// footer. Tab passes over Skipped rows; Shift+Tab still reaches them
// (requirements: Keyboard).
export function nextTabTarget(state: WorkupState, from: Focus, dir: 1 | -1): Focus {
  const sectionId =
    from?.kind === "field" ? sectionOf(from.id).id : from?.kind === "continue" ? from.section : state.section
  const ids = fieldIds(sectionId)
  const stops: Focus[] = [...ids.map((id) => ({ kind: "field", id }) as const), { kind: "continue", section: sectionId }]
  const at = from ? stops.findIndex((s) => sameFocus(s, from)) : -1
  for (let i = at + dir; i >= 0 && i < stops.length; i += dir) {
    const stop = stops[i]
    if (dir === 1 && stop?.kind === "field" && state.fields[stop.id].skipped) continue
    return stop
  }
  return null
}

export function sameFocus(a: Focus, b: Focus): boolean {
  if (a === null || b === null) return a === b
  if (a.kind === "field" && b.kind === "field") return a.id === b.id
  if (a.kind === "continue" && b.kind === "continue") return a.section === b.section
  return false
}

export type RailBadge = { blank: number; flagged: number; warnings: number; complete: boolean }

export function railBadges(state: WorkupState): Record<string, RailBadge> {
  return Object.fromEntries(
    sections.map((s) => {
      const c = sectionCounts(state, s.id)
      return [s.id, { blank: c.blank, flagged: c.flagged, warnings: c.warnings, complete: c.blank === 0 }]
    }),
  )
}

// The reference shows for the focused field when opened by hand, or when
// auto-show is on for its modality and the user hasn't closed it.
export function referenceVisible(state: WorkupState, autoShow: Record<"metric" | "morph", boolean>): boolean {
  const f = state.focus
  if (f?.kind !== "field") return false
  if (state.reference.dismissedFor === f.id) return false
  return state.reference.open || autoShow[variable(f.id).modality]
}

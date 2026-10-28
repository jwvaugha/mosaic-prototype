import { describe, expect, it } from "vitest"
import {
  blankFields,
  fieldIds,
  fieldStatus,
  flaggedFields,
  initialState,
  landingFocus,
  nextTabTarget,
  railBadges,
  reducer,
  referenceVisible,
  sectionCounts,
  type Action,
  type Focus,
  type WorkupState,
} from "./workup"

const MORPH = "cranium-morph"
const METRIC = "lower-limb-metric"

const run = (state: WorkupState, ...actions: Action[]) => actions.reduce(reducer, state)
const field = (id: string): Focus => ({ kind: "field", id })

// Follows Tab from the first field to the end and returns the stops visited.
function tabPath(state: WorkupState, section: string, dir: 1 | -1 = 1): string[] {
  const ids = fieldIds(section)
  let at: Focus = dir === 1 ? field(ids[0]) : { kind: "continue", section }
  const path: string[] = []
  while (at) {
    path.push(at.kind === "field" ? at.id : "continue")
    at = nextTabTarget(state, at, dir)
  }
  return path
}

describe("field status", () => {
  it("derives status from value, range, Skip and acknowledgement", () => {
    let s = initialState()
    expect(fieldStatus(s, "FemXL")).toBe("unreached")
    s = run(s, { type: "enter", id: "FemXL", value: "450" })
    expect(fieldStatus(s, "FemXL")).toBe("recorded")
    s = run(s, { type: "enter", id: "FemXL", value: "700" })
    expect(fieldStatus(s, "FemXL")).toBe("warning")
    s = run(s, { type: "acknowledge", id: "FemXL" })
    expect(fieldStatus(s, "FemXL")).toBe("acknowledged")
    s = run(s, { type: "enter", id: "FemXL", value: "710" })
    expect(fieldStatus(s, "FemXL")).toBe("warning")
  })

  it("ignores Morph codes that aren't Character states", () => {
    const s = run(initialState(), { type: "enter", id: "NBC", value: "9" })
    expect(fieldStatus(s, "NBC")).toBe("unreached")
  })

  it("seeds Midway with one open and one acknowledged warning", () => {
    const s = initialState("midway")
    expect(fieldStatus(s, "FemHXD")).toBe("warning")
    expect(fieldStatus(s, "TibDEB")).toBe("acknowledged")
  })
})

describe("Skip", () => {
  it("toggles on a blank field and is cleared by entering a value", () => {
    let s = run(initialState(), { type: "toggleSkip", id: "NAS" })
    expect(fieldStatus(s, "NAS")).toBe("skipped")
    s = run(s, { type: "toggleSkip", id: "NAS" })
    expect(fieldStatus(s, "NAS")).toBe("unreached")
    s = run(s, { type: "toggleSkip", id: "NAS" }, { type: "enter", id: "NAS", value: "2" })
    expect(fieldStatus(s, "NAS")).toBe("recorded")
  })

  it("Skipping a scored field clears its value; clear makes it blank again", () => {
    let s = run(initialState("midway"), { type: "toggleSkip", id: "NAS" })
    expect(fieldStatus(s, "NAS")).toBe("skipped")
    expect(s.fields.NAS.value).toBeNull()
    s = run(s, { type: "clear", id: "NAS" })
    expect(fieldStatus(s, "NAS")).toBe("unreached")
  })

  it("Skips a bone's blanks, and un-Skips them when all are Skipped", () => {
    let s = run(initialState("midway"), { type: "toggleSkipBone", boneId: "nasal" })
    expect(["NAS", "NAW", "NBS", "NBC"].map((id) => fieldStatus(s, id))).toEqual(Array(4).fill("recorded"))
    expect(["ANS", "INA"].map((id) => fieldStatus(s, id))).toEqual(["skipped", "skipped"])
    s = run(s, { type: "toggleSkipBone", boneId: "nasal" })
    expect(["ANS", "INA"].map((id) => fieldStatus(s, id))).toEqual(["unreached", "unreached"])
  })

  it("Skips every blank in a section (section check: Skip N and continue)", () => {
    const s = run(initialState("midway"), { type: "skipBlanks", section: MORPH })
    const c = sectionCounts(s, MORPH)
    expect(c).toMatchObject({ blank: 0, recorded: 6, skipped: c.total - 6 })
  })
})

describe("come back to flags", () => {
  it("toggles a flag, keeps a reason, and survives entering a value", () => {
    let s = run(
      initialState(),
      { type: "toggleFlag", id: "IOB" },
      { type: "setFlagReason", id: "IOB", reason: "ask-colleague" },
      { type: "enter", id: "IOB", value: "2" },
    )
    expect(s.fields.IOB.flag).toEqual({ reason: "ask-colleague" })
    expect(flaggedFields(s)).toEqual(["IOB"])
    s = run(s, { type: "toggleFlag", id: "IOB" })
    expect(flaggedFields(s)).toEqual([])
  })
})

describe("Tab order", () => {
  it("visits every field then the Continue footer", () => {
    expect(tabPath(initialState(), MORPH)).toEqual([...fieldIds(MORPH), "continue"])
  })

  it("passes over Skipped rows going forward, but not backward", () => {
    const s = run(initialState(), { type: "toggleSkip", id: "NBS" }, { type: "toggleSkip", id: "ANS" })
    expect(tabPath(s, MORPH)).not.toContain("NBS")
    expect(tabPath(s, MORPH)).not.toContain("ANS")
    expect(tabPath(s, MORPH, -1)).toContain("NBS")
  })

  it("visits flagged rows like any other (no Skip in the flag versions)", () => {
    const s = run(initialState(), { type: "toggleFlag", id: "NBS" })
    expect(tabPath(s, MORPH)).toEqual([...fieldIds(MORPH), "continue"])
  })

  it("stops at the section's ends", () => {
    const s = initialState()
    expect(nextTabTarget(s, { kind: "continue", section: MORPH }, 1)).toBeNull()
    expect(nextTabTarget(s, field(fieldIds(MORPH)[0]), -1)).toBeNull()
  })
})

describe("sections", () => {
  it("opens a section on its first blank field, or its footer when complete", () => {
    const s = initialState("midway")
    expect(landingFocus(s, METRIC)).toEqual(field("FemEB"))
    const done = run(s, { type: "skipBlanks", section: METRIC })
    expect(landingFocus(done, METRIC)).toEqual({ kind: "continue", section: METRIC })
  })

  it("moves the current section with focus", () => {
    const s = run(initialState(), { type: "focus", focus: field("TibCML") })
    expect(s.section).toBe(METRIC)
  })

  it("counts blanks, flags and open warnings for the rail", () => {
    const s = run(initialState("midway"), { type: "toggleFlag", id: "FemEB" })
    const badges = railBadges(s)
    expect(badges[MORPH]).toEqual({ blank: fieldIds(MORPH).length - 6, flagged: 0, warnings: 0, complete: false })
    expect(badges[METRIC]).toEqual({ blank: fieldIds(METRIC).length - 5, flagged: 1, warnings: 1, complete: false })
    expect(blankFields(s, METRIC).slice(0, 3)).toEqual(["FemEB", "FemMXD", "FemMWD"])
  })
})

describe("reference visibility", () => {
  const auto = { morph: true, metric: true }
  const off = { morph: false, metric: false }

  it("auto-shows for the focused field and comes back on the next field after closing", () => {
    let s = initialState()
    expect(referenceVisible(s, auto)).toBe(true)
    s = run(s, { type: "closeReference" })
    expect(referenceVisible(s, auto)).toBe(false)
    s = run(s, { type: "focus", focus: field("NAW") })
    expect(referenceVisible(s, auto)).toBe(true)
  })

  it("follows focus once opened by hand, until closed", () => {
    let s = run(initialState(), { type: "openReference" })
    expect(referenceVisible(s, off)).toBe(true)
    s = run(s, { type: "focus", focus: field("TibCML") })
    expect(referenceVisible(s, off)).toBe(true)
    s = run(s, { type: "closeReference" }, { type: "focus", focus: field("TibPEB") })
    expect(referenceVisible(s, off)).toBe(false)
  })

  it("hides on the Continue footer", () => {
    const s = run(initialState(), { type: "focus", focus: { kind: "continue", section: MORPH } })
    expect(referenceVisible(s, auto)).toBe(false)
  })
})

// The three ways of handling incomplete fields, from the Flows page
// (MOSAIC-Wireframing page 202:8167). Components read these flags; they never
// branch on the policy id.

export type IncompletionId = "skip-section" | "flag-section" | "flag-end"

export type IncompletionPolicy = {
  id: IncompletionId
  label: string
  short: string
  // `-` / `⇧-` mark fields Skipped.
  allowSkip: boolean
  // `⌥F` marks fields to come back to.
  allowFlag: boolean
  // What Continue checks before leaving a section with gaps.
  sectionCheck: "blanks" | "flags" | "none"
  // What the rail counts next to each section.
  railBadge: "blank" | "flagged"
  // Show the flag count on the Analyze button too.
  analyzeBadge: boolean
}

export const POLICIES: Record<IncompletionId, IncompletionPolicy> = {
  "skip-section": {
    id: "skip-section",
    label: "1 · Skip, with a per-section check",
    short: "Skip",
    allowSkip: true,
    allowFlag: false,
    sectionCheck: "blanks",
    railBadge: "blank",
    analyzeBadge: false,
  },
  "flag-section": {
    id: "flag-section",
    label: "2 · Come back to, with a per-section check",
    short: "Flag + section check",
    allowSkip: false,
    allowFlag: true,
    sectionCheck: "flags",
    railBadge: "flagged",
    analyzeBadge: false,
  },
  "flag-end": {
    id: "flag-end",
    label: "2.5 · Come back to, collected at the end",
    short: "Flag at end",
    allowSkip: false,
    allowFlag: true,
    sectionCheck: "none",
    railBadge: "flagged",
    analyzeBadge: true,
  },
}

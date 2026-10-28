import { REGIONS } from "@/data/chrome"
import {
  FLAG_REASONS,
  railBadges,
  sectionCounts,
  sectionOf,
  sections,
  variable,
  type WorkupState,
} from "@/domain/workup"
import type { RailState } from "./rail-context"

// Counts for the rail, the pre-Analysis check and the dialogs: live counts for
// the prototype's sections plus the static counts of the display-only ones.
// Regions come in rail order; only Regions in the Workup count toward totals
// (a Set-aside Region's Observations are kept but excluded).

export function regionCounts(state: WorkupState, rail: Pick<RailState, "order" | "membership" | "kept">) {
  const badges = railBadges(state)
  const totals = { recorded: 0, total: 0, skipped: 0 }
  const regions = rail.order.map((name) => {
    const r = REGIONS.find((x) => x.name === name)!
    const membership = rail.membership[name]
    const counted = membership === "in"
    let blank = 0
    const modalities = r.modalities.map((m) => {
      if (!m.live) {
        const total = m.total ?? 0
        // A Region added back after Inventory starts empty.
        const recorded = r.notInWorkup ? 0 : (m.recorded ?? 0)
        if (counted) {
          totals.recorded += recorded
          totals.total += total
          blank += total - recorded
        }
        return { label: m.label, recorded, total }
      }
      const c = sectionCounts(state, m.live)
      if (counted) {
        totals.recorded += c.recorded
        totals.total += c.total
        totals.skipped += c.skipped
        blank += c.blank
      }
      return {
        label: m.label,
        live: m.live,
        recorded: c.recorded,
        total: c.total,
        flagged: badges[m.live].flagged,
        warnings: badges[m.live].warnings,
      }
    })
    const errors = counted ? r.errors : undefined
    const warnings = counted ? r.warnings : undefined
    return {
      ...r,
      membership,
      kept: rail.kept[name] ?? 0,
      errors,
      warnings,
      modalities,
      blank,
      live: r.modalities.find((m) => m.live)?.live,
    }
  })
  return { regions, totals }
}

export function whereOf(id: string) {
  const s = sectionOf(id)
  return `${s.region} › ${s.modality === "metric" ? "Metric" : "Morphological"}`
}

export function flaggedItems(state: WorkupState, sectionId?: string) {
  const ids = sections
    .filter((s) => !sectionId || s.id === sectionId)
    .flatMap((s) => s.bones.flatMap((b) => b.variableIds.map((id) => ({ id, bone: b.name }))))
  return ids
    .filter(({ id }) => state.fields[id].flag)
    .map(({ id, bone }) => {
      const v = variable(id)
      const reason = state.fields[id].flag?.reason
      const where = sectionId ? bone : whereOf(id)
      return { id, title: `${v.name} · ${v.code}`, where: reason ? `${where} · ${FLAG_REASONS[reason]}` : where }
    })
}

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

// Counts for the rail, the pre-Analysis check and the dialogs: live counts for
// the prototype's sections plus the static counts of the display-only ones.

export function regionCounts(state: WorkupState) {
  const badges = railBadges(state)
  const totals = { recorded: 0, total: 0, skipped: 0 }
  const regions = REGIONS.map((r) => {
    let blank = 0
    const modalities = r.modalities.map((m) => {
      if (!m.live) {
        const total = m.total ?? 0
        const recorded = m.recorded ?? 0
        totals.recorded += recorded
        totals.total += total
        if (!r.setAside) blank += total - recorded
        return { label: m.label, recorded, total }
      }
      const c = sectionCounts(state, m.live)
      totals.recorded += c.recorded
      totals.total += c.total
      totals.skipped += c.skipped
      blank += c.blank
      return {
        label: m.label,
        live: m.live,
        recorded: c.recorded,
        total: c.total,
        flagged: badges[m.live].flagged,
        warnings: badges[m.live].warnings,
      }
    })
    return { ...r, modalities, blank, live: r.modalities.find((m) => m.live)?.live }
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

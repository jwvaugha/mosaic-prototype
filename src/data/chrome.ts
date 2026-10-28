import { fixture } from "./index"

// The Regions of the rail, in anatomical order, each with its Metric and
// Morphological sections from the fixture (every Variable in the data
// dictionaries). Two Regions start in a non-default state so the rail shows
// those cases: Thorax was left out at Inventory ("+ add"), and Shoulder &
// upper limb is set aside, keeping whatever values the seed gives it.

export type ChromeModality = {
  label: "Metric" | "Morphological"
  // Section id from the fixture.
  live?: string
  // Unused now that every section is live; kept for display-only additions.
  total?: number
  recorded?: number
}

export type ChromeRegion = {
  name: string
  setAside?: boolean
  notInWorkup?: boolean
  modalities: ChromeModality[]
  errors?: number
  warnings?: number
}

const ORDER = ["Cranium", "Mandible", "Dentition", "Vertebrae", "Thorax", "Shoulder & upper limb", "Pelvis", "Lower limb", "Whole skeleton"]

export const REGIONS: ChromeRegion[] = ORDER.map((name) => ({
  name,
  setAside: name === "Shoulder & upper limb" || undefined,
  notInWorkup: name === "Thorax" || undefined,
  modalities: fixture.sections
    .filter((s) => s.region === name)
    .map((s) => ({ label: s.modality === "metric" ? ("Metric" as const) : ("Morphological" as const), live: s.id })),
}))

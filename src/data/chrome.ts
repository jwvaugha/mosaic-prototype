// Display-only parts of the Workup, so the screen has the information density
// of the wireframes (Flows page, screens 1.2 and 1.4). Only the sections with a
// `live` id can be entered; everything else shows static counts.

export type ChromeModality = {
  label: "Metric" | "Morphological"
  // Section id from the fixture, or static counts.
  live?: string
  total?: number
  recorded?: number
}

export type ChromeRegion = {
  name: string
  // Starting membership: set aside with Observations kept, or left out at
  // Inventory ("+ add"). Both can change from the rail.
  setAside?: { kept: number }
  notInWorkup?: boolean
  modalities: ChromeModality[]
  // Static issue counts shown on collapsed regions.
  errors?: number
  warnings?: number
}

export const REGIONS: ChromeRegion[] = [
  {
    name: "Cranium",
    modalities: [
      { label: "Metric", total: 73, recorded: 12 },
      { label: "Morphological", live: "cranium-morph" },
    ],
  },
  { name: "Mandible", modalities: [{ label: "Metric", total: 4, recorded: 0 }, { label: "Morphological", total: 5, recorded: 0 }] },
  { name: "Dentition", modalities: [{ label: "Metric", total: 32, recorded: 0 }, { label: "Morphological", total: 55, recorded: 0 }] },
  { name: "Vertebrae", modalities: [{ label: "Metric", total: 22, recorded: 0 }] },
  { name: "Thorax", notInWorkup: true, modalities: [{ label: "Morphological", total: 9, recorded: 0 }] },
  { name: "Shoulder & upper limb", setAside: { kept: 8 }, modalities: [{ label: "Metric", total: 35, recorded: 8 }] },
  {
    name: "Pelvis",
    modalities: [
      { label: "Metric", total: 14, recorded: 14 },
      { label: "Morphological", total: 35, recorded: 13 },
    ],
  },
  {
    name: "Lower limb",
    modalities: [
      { label: "Metric", live: "lower-limb-metric" },
      { label: "Morphological", total: 6, recorded: 0 },
    ],
  },
  { name: "Whole skeleton", modalities: [{ label: "Morphological", total: 1, recorded: 0 }] },
]

// Bones scored per side. Side and Condition controls are display-only.
export const BILATERAL_BONES = new Set(["femur", "tibia"])

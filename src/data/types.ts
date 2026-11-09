// Domain terms follow CONTEXT.md in the MOSAIC project folder.

export type Modality = "metric" | "morph"

export type CharacterState = {
  code: string
  label: string
}

export type Variable = {
  id: string
  name: string
  fullName?: string
  // Shown only when it's a real abbreviation (requirements: Rows).
  code: string
  modality: Modality
  // Metric only
  unit?: string
  precision?: number
  range?: { min: number; max: number }
  dcp?: number
  definition?: string
  instrument?: string
  // Metric only: derived from other measurements, never typed (FORDISC).
  calculated?: boolean
  // Morph only
  states?: CharacterState[]
  // Dental traits whose FoRDent states aren't in the dictionary yet.
  statesPending?: boolean
  method?: string
}

export type Bone = {
  id: string
  name: string
  // Scored per side: shows the Side toggle.
  bilateral?: boolean
  variableIds: string[]
}

export type Section = {
  id: string
  region: string
  modality: Modality
  title: string
  bones: Bone[]
  // Calculated Variables, shown read-only after the bones.
  calculated?: string[]
}

export type Fixture = {
  generatedAt: string
  sections: Section[]
  variables: Record<string, Variable>
}

export type ImageAsset = {
  // Path under public/, served only in local builds (VITE_REAL_IMAGES=1).
  src: string
  width: number
  height: number
  // Photos only: the specimen or collection, from the file name.
  credit?: string
}

// Fractions of the figure's width and height.
export type Highlight = { x: number; y: number; w: number; h: number }

export type ReferenceEntry =
  // `states` holds one drawing per Character state (may be empty when only
  // photos exist); `photos` holds any number of example photos per state.
  | {
      kind: "states"
      states: Record<string, ImageAsset>
      // Further example drawings of a state, after the one in `states`.
      moreDrawings?: Record<string, ImageAsset[]>
      photos?: Record<string, ImageAsset[]>
      location?: ImageAsset
    }
  | { kind: "figure"; figure: ImageAsset; caption: string; highlight?: Highlight }
  | { kind: "none" }

export type ImageManifest = Record<string, ReferenceEntry>

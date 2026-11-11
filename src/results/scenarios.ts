import { fixture } from "@/data"
import { normalBands, type Analysis, type CategoricalResult, type UsedGroup } from "./model"

// Example Analyses for the results prototype. "Real" values are the model's
// output for held-out cases in the reviewers' handbook; anything the handbook
// doesn't give is marked illustrative, and two scenarios are made up.

export type ScenarioId = "sparse" | "rich" | "split" | "partial"

export const SCENARIOS: { id: ScenarioId; label: string; hint: string }[] = [
  { id: "sparse", label: "Three observations", hint: "Held-out case MONO-000672: real model output" },
  { id: "rich", label: "Most complete case", hint: "Held-out case with 358 inputs: real age and sex; the input list is drawn from our dictionary" },
  { id: "split", label: "Split evidence", hint: "Made up: age evidence pointing two ways" },
  { id: "partial", label: "Skull only", hint: "Made up: not enough evidence for age or stature" },
]

const CENSUS_N: Record<string, number> = {
  White: 1617,
  "Hispanic or Latino": 505,
  "Black or African American": 167,
  Asian: 111,
  "Native Hawaiian or Pacific Islander": 28,
  "American Indian or Alaska Native": 13,
  "Middle Eastern or North African": 3,
}

function census(ps: [string, number][], illustrative?: boolean): CategoricalResult {
  return {
    kind: "categorical",
    categories: ps.map(([label, p]) => ({ label, p, trainingN: CENSUS_N[label] })).sort((a, b) => b.p - a.p),
    illustrative,
  }
}

function sex(m: number, illustrative?: boolean): CategoricalResult {
  return {
    kind: "categorical",
    categories: [
      { label: "Male", p: m },
      { label: "Female", p: 1 - m },
    ].sort((a, b) => b.p - a.p),
    illustrative,
  }
}

const AGE = { lo: 10, step: 10 }
const STATURE = { lo: 130, step: 5 }

// "Bone · Variable" names from the dictionary, grouped by Region, for the
// larger made-up input lists. The dictionary spells one name wrongly.
const fixName = (n: string) => n.replace("sypmhysis", "symphysis")
function usedFromDictionary(limit: number, regions?: string[]): UsedGroup[] {
  const groups: UsedGroup[] = []
  let left = limit
  for (const s of fixture.sections) {
    if (regions && !regions.includes(s.region)) continue
    let g = groups.find((x) => x.region === s.region)
    if (!g) groups.push((g = { region: s.region, variables: [] }))
    for (const b of s.bones)
      for (const id of b.variableIds) {
        if (left-- <= 0) return groups.filter((x) => x.variables.length)
        g.variables.push({ name: `${b.name} · ${fixName(fixture.variables[id].name)}` })
      }
  }
  return groups.filter((x) => x.variables.length)
}

export function scenario(id: ScenarioId): Analysis {
  switch (id) {
    case "sparse":
      return {
        workupLabel: "MSUFAL016-26",
        number: 1,
        ranAt: "10 Nov 2026, 3:41 PM",
        estimates: {
          sex: { id: "sex", title: "Sex", result: sex(0.651) },
          age: {
            id: "age",
            title: "Age at death",
            unit: "years",
            result: {
              kind: "numeric",
              ...AGE,
              probs: [0.00245, 0.01336, 0.04885, 0.10586, 0.23203, 0.2472, 0.18745, 0.11221, 0.04626, 0.00434],
              estimate: 63.6,
              lower: 37,
              upper: 90,
            },
          },
          affinity: {
            id: "affinity",
            title: "Population affinity",
            result: census([
              ["White", 0.666],
              ["Hispanic or Latino", 0.204],
              ["Black or African American", 0.071],
              ["Asian", 0.042],
              ["Native Hawaiian or Pacific Islander", 0.01],
              ["American Indian or Alaska Native", 0.006],
              ["Middle Eastern or North African", 0.001],
            ]),
          },
          stature: {
            id: "stature",
            title: "Stature",
            unit: "cm",
            result: {
              kind: "numeric",
              ...STATURE,
              probs: normalBands(130, 5, 15, 172, 10.5),
              estimate: 172,
              lower: 152,
              upper: 188,
              illustrative: true,
            },
          },
        },
        used: [
          { region: "Thorax", variables: [{ name: "Ribs · Sternal rib ends" }] },
          { region: "Pelvis", variables: [{ name: "Pubis · Pubic symphysis" }] },
          { region: "Lower limb", variables: [{ name: "Tibia · Condylo-malleolar length" }] },
        ],
        notAnalysed: [
          { name: "Ilium · Auricular surface", region: "Pelvis", reason: "Skipped" },
          { name: "Femur · Maximum length", region: "Lower limb", reason: "Come back to: bone out for imaging" },
        ],
      }

    case "rich":
      return {
        workupLabel: "MSUFAL021-26",
        number: 2,
        ranAt: "10 Nov 2026, 4:05 PM",
        estimates: {
          sex: { id: "sex", title: "Sex", result: sex(0.99999999981) },
          age: {
            id: "age",
            title: "Age at death",
            unit: "years",
            result: {
              kind: "numeric",
              ...AGE,
              probs: [0, 0, 0, 0, 0.0144, 0.247, 0.6128, 0.1136, 0.0122, 0],
              estimate: 73.0,
              lower: 61,
              upper: 85,
            },
          },
          affinity: {
            id: "affinity",
            title: "Population affinity",
            result: census(
              [
                ["Black or African American", 0.991],
                ["White", 0.005],
                ["Hispanic or Latino", 0.003],
                ["Asian", 0.0007],
                ["Native Hawaiian or Pacific Islander", 0.0002],
                ["American Indian or Alaska Native", 0.0001],
                ["Middle Eastern or North African", 0],
              ],
              true,
            ),
          },
          stature: {
            id: "stature",
            title: "Stature",
            unit: "cm",
            result: {
              kind: "numeric",
              ...STATURE,
              probs: normalBands(130, 5, 15, 182.7, 4.2),
              estimate: 182.7,
              lower: 175.2,
              upper: 188,
              illustrative: true,
            },
          },
        },
        used: (() => {
          const g = usedFromDictionary(358)
          const limb = g.find((x) => x.region === "Lower limb")
          if (limb) limb.variables[0] = { name: "Femur · Maximum length", note: "581 mm, outside the training range; confirmed" }
          return g
        })(),
        notAnalysed: [{ name: "Whole skeleton · Overall robusticity", region: "Whole skeleton", reason: "Skipped" }],
      }

    case "split":
      return {
        workupLabel: "MSUFAL030-26",
        number: 1,
        ranAt: "10 Nov 2026, 4:20 PM",
        estimates: {
          sex: { id: "sex", title: "Sex", result: sex(0.42, true) },
          age: {
            id: "age",
            title: "Age at death",
            unit: "years",
            result: {
              kind: "numeric",
              ...AGE,
              probs: [0.005, 0.03, 0.12, 0.22, 0.1, 0.12, 0.24, 0.12, 0.04, 0.005],
              estimate: 60.8,
              lower: 31,
              upper: 89,
              illustrative: true,
            },
          },
          affinity: {
            id: "affinity",
            title: "Population affinity",
            result: census(
              [
                ["White", 0.52],
                ["Hispanic or Latino", 0.31],
                ["Black or African American", 0.09],
                ["Asian", 0.05],
                ["Native Hawaiian or Pacific Islander", 0.02],
                ["American Indian or Alaska Native", 0.008],
                ["Middle Eastern or North African", 0.002],
              ],
              true,
            ),
          },
          stature: {
            id: "stature",
            title: "Stature",
            unit: "cm",
            result: {
              kind: "numeric",
              ...STATURE,
              probs: normalBands(130, 5, 15, 161, 7),
              estimate: 161,
              lower: 149,
              upper: 173,
              illustrative: true,
            },
          },
        },
        used: usedFromDictionary(14, ["Thorax", "Pelvis", "Lower limb"]),
        notAnalysed: [],
      }

    case "partial":
      return {
        workupLabel: "MSUFAL033-26",
        number: 1,
        ranAt: "10 Nov 2026, 4:32 PM",
        estimates: {
          sex: { id: "sex", title: "Sex", result: sex(0.82, true) },
          age: {
            id: "age",
            title: "Age at death",
            unit: "years",
            result: {
              kind: "not-enough",
              reason: "No pelvis, rib or long-bone observations.",
              wouldHelp: ["Pelvis", "Thorax"],
            },
          },
          affinity: {
            id: "affinity",
            title: "Population affinity",
            result: census(
              [
                ["Hispanic or Latino", 0.47],
                ["White", 0.38],
                ["Black or African American", 0.07],
                ["Asian", 0.05],
                ["Native Hawaiian or Pacific Islander", 0.02],
                ["American Indian or Alaska Native", 0.009],
                ["Middle Eastern or North African", 0.001],
              ],
              true,
            ),
          },
          stature: {
            id: "stature",
            title: "Stature",
            unit: "cm",
            result: {
              kind: "not-enough",
              reason: "No long-bone measurements.",
              wouldHelp: ["Lower limb", "Shoulder & upper limb"],
            },
          },
        },
        used: usedFromDictionary(40, ["Cranium", "Mandible"]),
        notAnalysed: [],
      }
  }
}

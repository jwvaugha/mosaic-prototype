import { describe, expect, it } from "vitest"
import { fixture, imageManifest } from "."
import { SEEDS } from "./seeds"

describe("fixture", () => {
  it("has every Region's sections in rail order, Metric before Morphological", () => {
    expect(fixture.sections.map((s) => s.title)).toEqual([
      "Cranium · Metric",
      "Cranium · Morphological",
      "Mandible · Metric",
      "Mandible · Morphological",
      "Dentition · Metric",
      "Dentition · Morphological",
      "Vertebrae · Morphological",
      "Thorax · Morphological",
      "Shoulder & upper limb · Metric",
      "Shoulder & upper limb · Morphological",
      "Pelvis · Metric",
      "Pelvis · Morphological",
      "Lower limb · Metric",
      "Lower limb · Morphological",
      "Whole skeleton · Morphological",
    ])
  })

  it("holds every Variable in the data dictionaries", () => {
    // 93 cranial Metric (38 of them calculated) + 46 cranial Morphological
    // + 57 postcranial Metric + 86 postcranial Morphological + 8 dental
    // Metric + 79 dental Morphological.
    expect(Object.keys(fixture.variables)).toHaveLength(369)
    const placed = fixture.sections.flatMap((s) => [...s.bones.flatMap((b) => b.variableIds), ...(s.calculated ?? [])])
    expect(placed).toHaveLength(369)
  })

  it("references only Variables that exist, each once", () => {
    const ids = fixture.sections.flatMap((s) => s.bones.flatMap((b) => b.variableIds))
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(fixture.variables[id]).toBeDefined()
  })

  it("gives every Morph Variable Character states and every Metric Variable a unit and precision", () => {
    for (const v of Object.values(fixture.variables)) {
      if (v.modality === "morph") expect(v.states?.length, v.id).toBeGreaterThan(1)
      else {
        expect(["mm", "°"]).toContain(v.unit)
        expect(v.precision).toBeGreaterThan(0)
        if (v.range) expect(v.range.min).toBeLessThan(v.range.max)
      }
    }
  })

  it("has a manifest entry for every Variable, and state images only for real states", () => {
    for (const v of Object.values(fixture.variables)) {
      const entry = imageManifest[v.id]
      expect(entry, v.id).toBeDefined()
      if (entry.kind === "states") {
        const codes = v.states!.map((s) => s.code)
        for (const c of Object.keys(entry.states)) expect(codes, v.id).toContain(c)
      }
    }
  })

  it("has a drawing for every state of every MMS trait", () => {
    for (const v of Object.values(fixture.variables).filter((x) => x.method === "MMS")) {
      const entry = imageManifest[v.id]
      expect(entry.kind, v.id).toBe("states")
      if (entry.kind === "states") expect(Object.keys(entry.states).sort()).toEqual(v.states!.map((s) => s.code).sort())
    }
  })

  it("keeps the reference-image coverage the prototype is built around", () => {
    const count = (kind: string) => Object.values(imageManifest).filter((e) => e.kind === kind).length
    // 17 MMS traits plus the dental traits with a FoRDent image set.
    expect(count("states")).toBeGreaterThanOrEqual(90)
    // DCP figures for postcranial measurements.
    expect(count("figure")).toBeGreaterThanOrEqual(40)
    for (const id of ["NAS", "NBC", "ZS"]) expect(imageManifest[id].kind).toBe("states")
    for (const id of ["FemXL", "FemEB", "TibCML"]) expect(imageManifest[id]).toMatchObject({ kind: "figure", highlight: expect.any(Object) })
  })

  it("seeds only known Variables, with valid Morph codes", () => {
    for (const seed of Object.values(SEEDS)) {
      for (const [id, value] of Object.entries(seed.values)) {
        const v = fixture.variables[id]
        expect(v, id).toBeDefined()
        if (v.modality === "morph") expect(v.states!.map((s) => s.code)).toContain(value)
      }
    }
  })
})

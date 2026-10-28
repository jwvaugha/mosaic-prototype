import { describe, expect, it } from "vitest"
import { fixture, imageManifest } from "."
import { SEEDS } from "./seeds"

describe("fixture", () => {
  it("has the two prototype sections, in order", () => {
    expect(fixture.sections.map((s) => s.title)).toEqual([
      "Cranium · Morphological",
      "Lower limb · Metric",
    ])
  })

  it("references only Variables that exist, each once", () => {
    const ids = fixture.sections.flatMap((s) => s.bones.flatMap((b) => b.variableIds))
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(fixture.variables[id]).toBeDefined()
  })

  it("gives every Morph Variable Character states and every Metric Variable a unit and range", () => {
    for (const v of Object.values(fixture.variables)) {
      if (v.modality === "morph") expect(v.states?.length).toBeGreaterThan(1)
      else {
        expect(v.unit).toBe("mm")
        expect(v.range!.min).toBeLessThan(v.range!.max)
      }
    }
  })

  it("has a manifest entry for every Variable, with an image for every Morph state", () => {
    for (const v of Object.values(fixture.variables)) {
      const entry = imageManifest[v.id]
      expect(entry, v.id).toBeDefined()
      if (entry.kind === "states") {
        expect(Object.keys(entry.states).sort()).toEqual(v.states!.map((s) => s.code).sort())
      }
    }
  })

  it("keeps the manifest coverage the prototype is built around", () => {
    const kinds = Object.fromEntries(
      Object.entries(imageManifest).map(([id, e]) => [id, e.kind]),
    )
    expect(kinds).toMatchSnapshot()
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

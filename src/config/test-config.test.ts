import { describe, expect, it } from "vitest"
import { DEFAULT_CONFIG, fromQuery, toQuery, type TestConfig } from "./test-config"

describe("test config URL", () => {
  it("round-trips through the query string", () => {
    const c: TestConfig = {
      refLayout: "D",
      refOnDemandLayout: "C",
      autoShow: { morph: false, metric: true },
      incompletion: "flag-end",
      showKeyHints: false,
      seed: "midway",
    }
    expect(fromQuery(toQuery(c))).toEqual(c)
  })

  it("reads older two-layout links by their first layout", () => {
    expect(fromQuery("ref=C,A").refLayout).toBe("C")
  })

  it("ignores unknown values", () => {
    expect(fromQuery("ref=Z,Q&inc=nope&seed=x")).toEqual(DEFAULT_CONFIG)
  })
})

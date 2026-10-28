// Starting scenarios, selectable in test mode. Values are raw input strings;
// the domain layer derives each field's status from them.

export type SeedId = "fresh" | "midway"

export type Seed = {
  label: string
  values: Record<string, string>
  // Warnings the user has already acknowledged.
  acknowledged: string[]
}

export const SEEDS: Record<SeedId, Seed> = {
  fresh: { label: "Fresh (all blank)", values: {}, acknowledged: [] },
  midway: {
    label: "Midway (some entered, 2 warnings, a set-aside Region)",
    values: {
      NAS: "2",
      NAW: "1",
      NBS: "3",
      NBC: "2",
      ZS: "1",
      MT: "0",
      FemXL: "452",
      FemBL: "448",
      // Out of range (35–60): an unacknowledged warning.
      FemHXD: "64",
      TibCML: "371",
      // Out of range (38–60), already acknowledged.
      TibDEB: "62",
      // Shoulder & upper limb starts set aside, keeping these 8 values.
      ClavXL: "148",
      ClavMXD: "13",
      ClavMWD: "11",
      ScH: "158",
      ScB: "104",
      ScGB: "27",
      ScGH: "37",
      HumXL: "322",
    },
    acknowledged: ["TibDEB"],
  },
}

import fixtureJson from "./fixture.json"
import manifestJson from "./image-manifest.json"
import type { Fixture, ImageAsset, ImageManifest } from "./types"

export const fixture = fixtureJson as Fixture
export const imageManifest = manifestJson as ImageManifest

// Every reference image goes on the public site. The PIs cleared them for the
// prototype on 2026-11-18, provisionally: it isn't published or circulated
// professionally, and it shows rights holders (e.g. the DCP 2.0 authors, the
// Walker and Klales plates) how the product will use their figures.
// Callers still draw a placeholder at the same aspect ratio when there's no URL.
export function imageUrl(asset: ImageAsset): string | null {
  return `${import.meta.env.BASE_URL}${asset.src}`
}

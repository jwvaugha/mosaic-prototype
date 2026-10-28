import fixtureJson from "./fixture.json"
import manifestJson from "./image-manifest.json"
import type { Fixture, ImageAsset, ImageManifest } from "./types"

export const fixture = fixtureJson as Fixture
export const imageManifest = manifestJson as ImageManifest

// Which reference images can go on the public site (cleared 2026-10-28):
// the MSU drawings (MMS), whose creators are the PIs, and the FoRDent dental
// drawings. The DCP 2.0 figures come from a UTK manual, so they stay in local
// builds (VITE_REAL_IMAGES=1) until that's confirmed. Anything not shown
// draws a placeholder at the same aspect ratio.
const PUBLISHED = ["ref-images/mms/", "ref-images/dental/"]

export const localImages = import.meta.env.VITE_REAL_IMAGES === "1"

export function isPublished(asset: ImageAsset): boolean {
  return PUBLISHED.some((p) => asset.src.startsWith(p))
}

export function imageUrl(asset: ImageAsset): string | null {
  return localImages || isPublished(asset) ? `${import.meta.env.BASE_URL}${asset.src}` : null
}

import fixtureJson from "./fixture.json"
import manifestJson from "./image-manifest.json"
import type { Fixture, ImageAsset, ImageManifest } from "./types"

export const fixture = fixtureJson as Fixture
export const imageManifest = manifestJson as ImageManifest

// Real reference images are git-ignored and exist only in local builds run
// with VITE_REAL_IMAGES=1. Everywhere else, components draw a placeholder at
// the same aspect ratio.
export const realImages = import.meta.env.VITE_REAL_IMAGES === "1"

export function imageUrl(asset: ImageAsset): string | null {
  return realImages ? `${import.meta.env.BASE_URL}${asset.src}` : null
}

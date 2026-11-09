import { useSyncExternalStore } from "react"
import type { ImageAsset, ReferenceEntry } from "@/data/types"

// The reference panel's Drawings / Photos choice. Like the panel's on/off
// switch, it stays as set while moving between fields, and is shared by the
// header toggle and the images under it.

export type RefMedia = "drawings" | "photos"

let current: RefMedia = "drawings"
const listeners = new Set<() => void>()

export function setRefMedia(m: RefMedia) {
  current = m
  for (const l of listeners) l()
}

export function useRefMedia(): RefMedia {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

export function hasDrawings(entry: ReferenceEntry): boolean {
  return entry.kind === "states" && Object.keys(entry.states).length > 0
}

export function hasPhotos(entry: ReferenceEntry): boolean {
  return entry.kind === "states" && !!entry.photos && Object.keys(entry.photos).length > 0
}

// What the panel shows for this entry: the chosen media when the Variable has
// it, otherwise whichever it does have.
export function effectiveMedia(entry: ReferenceEntry, chosen: RefMedia): RefMedia {
  if (chosen === "photos" && !hasPhotos(entry)) return "drawings"
  if (chosen === "drawings" && !hasDrawings(entry) && hasPhotos(entry)) return "photos"
  return chosen
}

// Every example image of one state in the given media, drawings first-filed
// first. Dental states with several drawings (filed 4.1, 4.2…) and MMS
// states with several photos (A, B, C…) are examples of one state.
export function examplesOf(entry: ReferenceEntry, media: RefMedia, code: string | undefined): ImageAsset[] {
  if (entry.kind !== "states" || code === undefined) return []
  if (media === "photos") return entry.photos?.[code] ?? []
  const first = entry.states[code]
  return first ? [first, ...(entry.moreDrawings?.[code] ?? [])] : []
}

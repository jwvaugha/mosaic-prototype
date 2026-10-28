import { useSyncExternalStore } from "react"

// True while the media query matches, e.g. useMediaQuery("(max-width: 1023px)").
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", onChange)
      return () => m.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

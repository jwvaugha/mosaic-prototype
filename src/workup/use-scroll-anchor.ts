import { useEffect, useLayoutEffect, useRef, type RefObject } from "react"

// For the inline reference (C): when focus moves, the expansion closes under
// the old row and opens under the new one, so every row in between shifts.
// This keeps the eye still by scrolling, before paint, so that:
//   - Tab / ⇧Tab: the new focused row lands where the previous one was
//   - click:      the clicked row stays where it was clicked
// When the reference wouldn't fit below the row, it scrolls just enough to
// show it, without pushing the row off the top. Moving to another section
// starts at the top as usual.

const MARGIN = 16

export function useScrollAnchor(
  container: RefObject<HTMLElement | null>,
  focusId: string | null,
  section: string,
  enabled: boolean,
) {
  // Where the focused row sits in the viewport, kept current while scrolling.
  const anchor = useRef<number | null>(null)
  // A row the pointer just pressed, and where it was at that moment.
  const pressed = useRef<{ id: string; top: number } | null>(null)
  const lastSection = useRef(section)

  const rowOf = (id: string) => container.current?.querySelector<HTMLElement>(`[data-variable="${id}"]`) ?? null
  const offset = (el: HTMLElement) => el.getBoundingClientRect().top - container.current!.getBoundingClientRect().top

  useEffect(() => {
    const c = container.current
    if (!c) return
    const onScroll = () => {
      const el = focusId ? rowOf(focusId) : null
      if (el) anchor.current = offset(el)
    }
    const onPointer = (e: PointerEvent) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("[data-variable]")
      pressed.current = row && c.contains(row) ? { id: row.dataset.variable!, top: offset(row) } : null
    }
    const onKey = () => {
      pressed.current = null
    }
    c.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pointerdown", onPointer, true)
    window.addEventListener("keydown", onKey, true)
    return () => {
      c.removeEventListener("scroll", onScroll)
      window.removeEventListener("pointerdown", onPointer, true)
      window.removeEventListener("keydown", onKey, true)
    }
  })

  useLayoutEffect(() => {
    const c = container.current
    const el = focusId ? rowOf(focusId) : null
    if (!c || !el) return
    if (lastSection.current !== section) {
      lastSection.current = section
      anchor.current = null
    }
    if (enabled) {
      const desired = pressed.current?.id === focusId ? pressed.current.top : anchor.current
      if (desired !== null) c.scrollTop += offset(el) - desired
      // Make room for the reference below the row if it's cut off.
      const overflow = el.getBoundingClientRect().bottom - (c.getBoundingClientRect().bottom - MARGIN)
      if (overflow > 0) c.scrollTop += Math.min(overflow, offset(el) - MARGIN)
    }
    pressed.current = null
    anchor.current = offset(el)
  }, [focusId, section, enabled])
}

import { useEffect, useSyncExternalStore } from "react"

// E asks for a field's enlarged view. The key handler doesn't own the image:
// the reference panel does, and it may only just be opening. So the request
// waits here until the image for that field mounts (or is already there) and
// takes it.

type Request = { id: string; code?: string } | null

let pending: Request = null
const listeners = new Set<() => void>()

// `code`: for a trait, the state to open on (the one in focus when E was
// pressed).
export function requestEnlarge(id: string, code?: string) {
  // A new object each time, so a second E on the same field still notifies.
  pending = { id, code }
  for (const l of listeners) l()
}

export function useEnlargeRequest(id: string | undefined, open: (code?: string) => void) {
  const request = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => pending,
  )
  useEffect(() => {
    if (id && request && request.id === id) {
      pending = null
      open(request.code)
    }
    // `open` changes every render; the request is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, id])
}

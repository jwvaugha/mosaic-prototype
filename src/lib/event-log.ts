// In-memory log of handled keys and actions, for comparing modes. Nothing
// leaves the browser. The test-mode panel (issue 09) reads it.

export type LogEvent = {
  t: number
  kind: "key" | "click" | "action" | "dialog"
  name: string
  field?: string
  mode?: string
}

const events: LogEvent[] = []
const listeners = new Set<() => void>()

export function logEvent(e: Omit<LogEvent, "t">) {
  events.push({ ...e, t: Date.now() })
  listeners.forEach((l) => l())
}

export function getEvents(): readonly LogEvent[] {
  return events
}

export function clearEvents() {
  events.length = 0
  listeners.forEach((l) => l())
}

export function subscribeEvents(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

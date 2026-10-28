// Log of handled keys, clicks, actions and dialogs, for comparing setups.
// It's kept in localStorage so it survives reloads and setup links, and every
// entry records the setup it happened in. Nothing leaves the browser unless
// the tester copies it from Test mode.

export type LogEvent = {
  t: number
  kind: "key" | "click" | "action" | "dialog"
  name: string
  field?: string
  mode?: string
  // e.g. "inc=flag-end ref=A,C auto=morph,metric seed=fresh"
  setup?: string
}

const KEY = "mosaic-proto:events"
const MAX = 5000

function load(): LogEvent[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

let events: LogEvent[] = load()
let setup = ""
const listeners = new Set<() => void>()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(events))
  } catch {
    // Storage full or blocked: the in-memory log still works.
  }
}

export function setLogSetup(s: string) {
  setup = s
}

export function logEvent(e: Omit<LogEvent, "t" | "setup">) {
  events = [...events.slice(-(MAX - 1)), { ...e, t: Date.now(), setup }]
  save()
  listeners.forEach((l) => l())
}

export function getEvents(): readonly LogEvent[] {
  return events
}

export function clearEvents() {
  events = []
  save()
  listeners.forEach((l) => l())
}

export function subscribeEvents(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

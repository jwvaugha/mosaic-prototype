import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { REGIONS } from "@/data/chrome"
import { sections } from "@/domain/workup"

// What the Region Rail lets a user change about this Workup (requirements:
// Left rail; Figma: Region Rail family):
//   - the Region order, edited in "Edit order" mode. It applies to this
//     Workup only; "Save as my default order" stores it for new Workups.
//   - which Regions are in the Workup. A Region left out shows "+ add".
//     Removing one with Observations sets it aside ("N kept · add back").
//   - which Regions are expanded.
// It lives inside the WorkupProvider, so a fresh Workup starts fresh here too.

export type Membership = "in" | "out" | "set-aside"

export type RailState = {
  order: string[]
  membership: Record<string, Membership>
  // Observations a Set-aside Region keeps.
  kept: Record<string, number>
  expanded: Set<string>
  mode: "default" | "edit"
  savedDefault: boolean
}

const ANATOMICAL = REGIONS.map((r) => r.name)
const DEFAULT_ORDER_KEY = "mosaic-proto:rail-order"

function storedOrder(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DEFAULT_ORDER_KEY) ?? "null")
    // Only trust a stored order that names exactly the known Regions.
    if (Array.isArray(raw) && raw.length === ANATOMICAL.length && ANATOMICAL.every((n) => raw.includes(n))) return raw
  } catch {
    // Blocked storage: fall back to anatomical.
  }
  return ANATOMICAL
}

function initialRail(): RailState {
  const membership: Record<string, Membership> = {}
  const kept: Record<string, number> = {}
  for (const r of REGIONS) {
    membership[r.name] = r.setAside ? "set-aside" : r.notInWorkup ? "out" : "in"
    if (r.setAside) kept[r.name] = r.setAside.kept
  }
  // Regions with an enterable section start open; the rest start collapsed.
  const expanded = new Set(REGIONS.filter((r) => r.modalities.some((m) => m.live)).map((r) => r.name))
  return { order: storedOrder(), membership, kept, expanded, mode: "default", savedDefault: false }
}

type RailContextValue = {
  rail: RailState
  // Enterable section ids in rail order, leaving out Regions not in the Workup.
  sectionOrder: string[]
  toggle: (region: string, open?: boolean) => void
  add: (region: string) => void
  remove: (region: string, kept: number) => void
  move: (region: string, to: number) => void
  setMode: (mode: RailState["mode"]) => void
  saveDefault: () => void
  resetOrder: () => void
}

const RailContext = createContext<RailContextValue | null>(null)

export function RailProvider({ children }: { children: ReactNode }) {
  const [rail, setRail] = useState(initialRail)

  // Actions never change identity, so effects can depend on them.
  const actions = useMemo(() => {
    const update = (fn: (r: RailState) => Partial<RailState>) => setRail((r) => ({ ...r, ...fn(r) }))
    return {
      toggle: (region: string, open?: boolean) =>
        setRail((r) => {
          const isOpen = r.expanded.has(region)
          if ((open ?? !isOpen) === isOpen) return r
          const expanded = new Set(r.expanded)
          if (isOpen) expanded.delete(region)
          else expanded.add(region)
          return { ...r, expanded }
        }),
      add: (region: string) =>
        update((r) => ({
          membership: { ...r.membership, [region]: "in" },
          expanded: new Set(r.expanded).add(region),
        })),
      remove: (region: string, kept: number) =>
        update((r) => ({
          membership: { ...r.membership, [region]: kept > 0 ? "set-aside" : "out" },
          kept: { ...r.kept, [region]: kept },
        })),
      move: (region: string, to: number) =>
        update((r) => {
          const order = r.order.filter((n) => n !== region)
          order.splice(Math.max(0, Math.min(to, order.length)), 0, region)
          return { order, savedDefault: false }
        }),
      setMode: (mode: RailState["mode"]) => update(() => ({ mode, savedDefault: false })),
      saveDefault: () =>
        update((r) => {
          try {
            localStorage.setItem(DEFAULT_ORDER_KEY, JSON.stringify(r.order))
          } catch {
            // Blocked storage: the confirmation still shows; nothing persists.
          }
          return { savedDefault: true }
        }),
      resetOrder: () => update(() => ({ order: ANATOMICAL, savedDefault: false })),
    }
  }, [])

  const value = useMemo<RailContextValue>(() => {
    const sectionOrder = rail.order
      .filter((name) => rail.membership[name] === "in")
      .flatMap((name) => sections.filter((s) => s.region === name).map((s) => s.id))
    return { rail, sectionOrder, ...actions }
  }, [rail, actions])

  return <RailContext.Provider value={value}>{children}</RailContext.Provider>
}

export function useRail() {
  const ctx = useContext(RailContext)
  if (!ctx) throw new Error("useRail needs a RailProvider")
  return ctx
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react"
import { useConfig } from "@/config/config-context"
import { initialState, reducer, type Action, type Focus, type WorkupState } from "@/domain/workup"
import { logEvent } from "@/lib/event-log"

// Holds the Workup reducer and a registry of focus targets. Focus lives in
// state; whenever it changes, the matching DOM element is focused and
// scrolled into view. Rows report focus they receive from clicks back
// through `focus()`.

type WorkupContextValue = {
  state: WorkupState
  dispatch: (a: Action) => void
  register: (key: string) => (el: HTMLElement | null) => void
  // Puts DOM focus on a registered element now, e.g. after a click on a
  // row's label, where the browser wouldn't move focus by itself.
  focusNow: (key: string) => void
}

const WorkupContext = createContext<WorkupContextValue | null>(null)

export function focusKey(f: Focus): string | null {
  if (!f) return null
  return f.kind === "field" ? f.id : `continue:${f.section}`
}

export function WorkupProvider({ children }: { children: ReactNode }) {
  const { config } = useConfig()
  const [state, rawDispatch] = useReducer(reducer, null, () => initialState(config.seed, config.start))
  const elements = useRef(new Map<string, HTMLElement>())

  const dispatch = useCallback(
    (a: Action) => {
      if (a.type !== "focus") {
        logEvent({ kind: "action", name: a.type, field: "id" in a ? a.id : undefined, mode: config.incompletion })
      }
      rawDispatch(a)
    },
    [config.incompletion],
  )

  const key = focusKey(state.focus)
  const currentKey = useRef(key)
  currentKey.current = key

  const register = useCallback(
    (k: string) => (el: HTMLElement | null) => {
      if (!el) {
        elements.current.delete(k)
        return
      }
      elements.current.set(k, el)
      // A row can swap its focus target while focused (Skip ↔ un-Skip);
      // keep focus on the replacement instead of dropping it to <body>.
      if (k === currentKey.current && (!document.activeElement || document.activeElement === document.body)) {
        el.focus({ preventScroll: true })
      }
    },
    [],
  )

  useEffect(() => {
    if (!key) return
    const el = elements.current.get(key)
    if (!el) return
    if (el !== document.activeElement && !el.contains(document.activeElement)) {
      el.focus({ preventScroll: true })
    }
    el.closest("[data-variable], [data-continue]")?.scrollIntoView({ block: "nearest" })
  }, [key, state.section])

  const focusNow = useCallback((k: string) => {
    const el = elements.current.get(k)
    if (el && el !== document.activeElement && !el.contains(document.activeElement)) el.focus({ preventScroll: true })
  }, [])

  return <WorkupContext.Provider value={{ state, dispatch, register, focusNow }}>{children}</WorkupContext.Provider>
}

export function useWorkup() {
  const ctx = useContext(WorkupContext)
  if (!ctx) throw new Error("useWorkup needs a WorkupProvider")
  return ctx
}

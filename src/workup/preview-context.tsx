import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

// The Character state being looked at but not (yet) chosen, shared by every
// place a Morph field's states appear: the row's state buttons and the
// reference panel's large image and strip. Hovering or arrowing through
// states in either place previews it in both.
//   source "focus": arrow keys moved focus onto a state button; Enter picks it
//   source "hover": the pointer is over a state

export type Preview = { id: string; code: string; source: "focus" | "hover" } | null

type PreviewContextValue = {
  preview: Preview
  setPreview: (p: Preview) => void
  // Clears the preview only if it still belongs to this field.
  clearPreview: (id: string, source?: "focus" | "hover") => void
}

const PreviewContext = createContext<PreviewContextValue | null>(null)

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<Preview>(null)
  const clearPreview = useCallback(
    (id: string, source?: "focus" | "hover") =>
      setPreview((p) => (p && p.id === id && (!source || p.source === source) ? null : p)),
    [],
  )
  const value = useMemo(() => ({ preview, setPreview, clearPreview }), [preview, clearPreview])
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
}

export function usePreview() {
  const ctx = useContext(PreviewContext)
  if (!ctx) throw new Error("usePreview needs a PreviewProvider")
  return ctx
}

// The previewed state code for one field, or null.
export function usePreviewFor(id: string) {
  const { preview, setPreview, clearPreview } = usePreview()
  const code = preview?.id === id ? preview.code : null
  return {
    code,
    source: preview?.id === id ? preview.source : null,
    show: (c: string, source: "focus" | "hover") => setPreview({ id, code: c, source }),
    clear: (source?: "focus" | "hover") => clearPreview(id, source),
  }
}

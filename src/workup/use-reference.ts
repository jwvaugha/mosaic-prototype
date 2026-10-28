import { useConfig } from "@/config/config-context"
import { imageManifest } from "@/data"
import type { RefLayout } from "@/config/test-config"
import { variable } from "@/domain/workup"
import type { ReferenceData } from "@/components/mosaic/reference/reference-parts"
import { useWorkup } from "./workup-context"

// The reference panel: one on/off switch (stays as set), the layout under
// test, and what to show. `data` is the focused field's reference, or null
// when focus is elsewhere (a bone header, Conditions, Continue), in which
// case A and D show a placeholder.
export function useReference(): {
  open: boolean
  data: ReferenceData | null
  layout: RefLayout
  toggle: () => void
  close: () => void
} {
  const { state, dispatch } = useWorkup()
  const { config } = useConfig()
  const f = state.focus
  const v = f?.kind === "field" ? variable(f.id) : null
  return {
    open: state.reference.open,
    data: v ? { variable: v, entry: imageManifest[v.id] ?? { kind: "none" }, value: state.fields[v.id].value } : null,
    layout: config.refLayout,
    toggle: () => dispatch({ type: "toggleReference" }),
    close: () => dispatch({ type: "closeReference" }),
  }
}

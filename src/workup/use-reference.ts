import { useConfig } from "@/config/config-context"
import { imageManifest } from "@/data"
import type { RefLayout } from "@/config/test-config"
import { referenceVisible, variable } from "@/domain/workup"
import type { ReferenceData } from "@/components/mosaic/reference/reference-parts"
import { useWorkup } from "./workup-context"

// Which reference to show, and how. The layout comes from the test config per
// modality; with "C on demand", a panel opened by hand uses C while auto-show
// keeps the configured layout.
export function useReference(): { data: ReferenceData | null; layout: RefLayout; close: () => void } {
  const { state, dispatch } = useWorkup()
  const { config } = useConfig()
  const close = () => dispatch({ type: "closeReference" })
  if (!referenceVisible(state, config.autoShow) || state.focus?.kind !== "field") {
    return { data: null, layout: "A", close }
  }
  const v = variable(state.focus.id)
  const auto = config.autoShow[v.modality]
  const layout = config.refOnDemandLayout === "C" && !auto ? "C" : config.refLayout
  return {
    data: { variable: v, entry: imageManifest[v.id] ?? { kind: "none" }, value: state.fields[v.id].value },
    layout,
    close,
  }
}

import { usePreviewFor } from "@/workup/preview-context"
import { useWorkup } from "@/workup/workup-context"
import {
  definitionOf,
  Facts,
  LargeState,
  MetricFigure,
  MoreSection,
  morphHint,
  PanelHeader,
  StateStrip,
  type ReferenceData,
} from "./reference-parts"

// The three reference-panel directions (Explorations rows 1 and 1.5):
//   A  Docked column: 360 px, right of the pane, full height
//   C  Inline expansion under the focused row; the rows below move down
//   D  Bottom dock: a strip across the bottom of the pane
// Each takes the same data; only the arrangement differs.

// The preview is shared with the row's state buttons (preview-context), so
// arrowing through states in the row shows them here, and hovering here
// outlines them in the row. Clicking a drawing selects that state.
function useStates(id: string) {
  const p = usePreviewFor(id)
  const { dispatch } = useWorkup()
  return {
    preview: p.code,
    onPreview: (code: string | null) => (code ? p.show(code, "hover") : p.clear("hover")),
    onSelect: (code: string) => dispatch({ type: "enter", id, value: code }),
  }
}

const factsOf = (d: ReferenceData): [string, string][] => {
  const v = d.variable
  const f: [string, string][] = []
  if (v.instrument) f.push(["Instrument", v.instrument])
  f.push(["Precision", `${v.precision} ${v.unit}`])
  if (v.range) f.push(["Usual range", `${v.range.min}–${v.range.max} ${v.unit}`])
  if (v.dcp) f.push(["Source", `DCP 2.0 #${v.dcp}`])
  return f
}

export function DockedColumn({ data, onClose }: { data: ReferenceData; onClose: () => void }) {
  const v = data.variable
  const states = useStates(v.id)
  const preview = states.preview
  return (
    <aside
      aria-label="Reference"
      className={
        // 360 px; 300 px below 1280; below 1024 a drawer over the pane, so the
        // rows keep their width (requirements: "collapses to a drawer").
        "flex w-[360px] shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-6 max-xl:w-[300px] max-xl:p-5 " +
        "max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20 max-lg:w-[320px] max-lg:shadow-xl"
      }
    >
      <PanelHeader label="Reference" onClose={onClose} />
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{v.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{v.code}</span>
      </div>
      {v.modality === "morph" ? (
        <>
          <LargeState data={data} preview={preview} className="h-[220px]" />
          <StateStrip data={data} preview={preview} onPreview={states.onPreview} onSelect={states.onSelect} thumbClassName="h-24" />
          <p className="text-xs text-muted-foreground">{morphHint}</p>
        </>
      ) : (
        <>
          <MetricFigure data={data} className="h-[160px]" />
          <p className="text-xs text-muted-foreground">Measurement drawing. Click the drawing to enlarge.</p>
        </>
      )}
      <p className="text-sm">{definitionOf(v)}</p>
      {v.modality === "metric" && <Facts items={factsOf(data)} />}
      <MoreSection v={v} />
    </aside>
  )
}

export function InlineExpansion({ data, onClose }: { data: ReferenceData; onClose: () => void }) {
  const v = data.variable
  const states = useStates(v.id)
  const preview = states.preview
  const wide = data.entry.kind === "figure" && data.entry.figure.width / data.entry.figure.height > 2
  return (
    // Image beside the text; on narrow panes (and for 3:1 long-bone figures)
    // the image goes on top at full width.
    <div className="@container w-full pb-2 pl-7 max-md:pl-0">
      <div className={`flex flex-col gap-5 rounded-lg border bg-muted/50 p-4 ${wide ? "" : "@min-[560px]:flex-row"}`}>
        {v.modality === "morph" ? (
          <LargeState data={data} preview={preview} className="h-[190px] w-full shrink-0 @min-[560px]:w-[280px]" />
        ) : (
          <MetricFigure data={data} className={wide ? "h-[200px] w-full" : "h-[182px] w-full shrink-0 @min-[560px]:w-[218px]"} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <PanelHeader label={`Reference · ${v.code}`} onClose={onClose} />
          {v.modality === "morph" && (
            <>
              <StateStrip data={data} preview={preview} onPreview={states.onPreview} onSelect={states.onSelect} thumbClassName="h-20" />
              <p className="text-xs text-muted-foreground">{morphHint}</p>
            </>
          )}
          <p className="text-sm">{definitionOf(v)}</p>
          {v.modality === "metric" && <Facts items={factsOf(data)} />}
          <MoreSection v={v} />
        </div>
      </div>
    </div>
  )
}

export const DOCK_HEIGHT = 260

export function BottomDock({ data, onClose }: { data: ReferenceData; onClose: () => void }) {
  const v = data.variable
  const states = useStates(v.id)
  const preview = states.preview
  return (
    <div
      className="@container absolute inset-x-0 bottom-0 z-10 flex gap-4 border-t bg-background px-4 pt-4 pb-5 shadow-[0_-4px_12px_-4px_rgb(12_23_62/0.08)] lg:gap-5 lg:px-10 lg:pt-5 lg:pb-6"
      style={{ height: DOCK_HEIGHT }}
      aria-label="Reference"
    >
      {v.modality === "morph" ? (
        // Shares of the dock rather than fixed widths, so it never spills.
        <LargeState data={data} preview={preview} className="h-full w-[30%] max-w-[240px] min-w-[140px] shrink-0" />
      ) : (
        <MetricFigure data={data} className="h-full w-[45%] max-w-[520px] min-w-[200px] shrink-0" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <PanelHeader label={`Reference · ${v.name} (${v.code})`} onClose={onClose} />
        {v.modality === "morph" ? (
          <>
            <StateStrip data={data} preview={preview} onPreview={states.onPreview} onSelect={states.onSelect} thumbClassName="h-[104px]" />
            <p className="line-clamp-2 text-sm">{definitionOf(v)}</p>
          </>
        ) : (
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto @min-[900px]:flex-row @min-[900px]:gap-6">
            <p className="line-clamp-3 flex-1 text-sm @min-[900px]:line-clamp-none">{definitionOf(v)}</p>
            <div className="shrink-0 @min-[900px]:w-[240px]">
              <Facts items={factsOf(data)} />
            </div>
          </div>
        )}
        <MoreSection v={v} />
      </div>
    </div>
  )
}

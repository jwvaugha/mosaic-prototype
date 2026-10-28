import { useEffect, useState } from "react"
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

function usePreview(id: string) {
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => setPreview(null), [id])
  return [preview, setPreview] as const
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
  const [preview, setPreview] = usePreview(v.id)
  return (
    <aside className="flex w-[360px] shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-6" aria-label="Reference">
      <PanelHeader label="Reference" onClose={onClose} />
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{v.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{v.code}</span>
      </div>
      {v.modality === "morph" ? (
        <>
          <LargeState data={data} preview={preview} className="h-[220px]" />
          <StateStrip data={data} preview={preview} onPreview={setPreview} thumbClassName="h-24" />
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
  const [preview, setPreview] = usePreview(v.id)
  const wide = data.entry.kind === "figure" && data.entry.figure.width / data.entry.figure.height > 2
  return (
    <div className="w-[760px] pb-2 pl-7">
      <div className={`flex gap-5 rounded-lg border bg-muted/50 p-4 ${wide ? "flex-col" : ""}`}>
        {v.modality === "morph" ? (
          <LargeState data={data} preview={preview} className="h-[190px] w-[280px] shrink-0" />
        ) : (
          // Long-bone figures are about 3:1, so they get the full width.
          <MetricFigure data={data} className={wide ? "h-[200px] w-full" : "h-[182px] w-[218px] shrink-0"} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <PanelHeader label={`Reference · ${v.code}`} onClose={onClose} />
          {v.modality === "morph" && (
            <>
              <StateStrip data={data} preview={preview} onPreview={setPreview} thumbClassName="h-20" />
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
  const [preview, setPreview] = usePreview(v.id)
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-10 flex gap-5 border-t bg-background px-10 pt-5 pb-6 shadow-[0_-4px_12px_-4px_rgb(12_23_62/0.08)]"
      style={{ height: DOCK_HEIGHT }}
      aria-label="Reference"
    >
      {v.modality === "morph" ? (
        <LargeState data={data} preview={preview} className="h-full w-[240px] shrink-0" />
      ) : (
        <MetricFigure data={data} className="h-full w-[520px] shrink-0" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <PanelHeader label={`Reference · ${v.name} (${v.code})`} onClose={onClose} />
        {v.modality === "morph" ? (
          <>
            <StateStrip data={data} preview={preview} onPreview={setPreview} thumbClassName="h-[104px]" />
            <p className="line-clamp-2 text-sm">{definitionOf(v)}</p>
          </>
        ) : (
          <div className="flex gap-6">
            <p className="flex-1 text-sm">{definitionOf(v)}</p>
            <div className="w-[240px] shrink-0">
              <Facts items={factsOf(data)} />
            </div>
          </div>
        )}
        <MoreSection v={v} />
      </div>
    </div>
  )
}

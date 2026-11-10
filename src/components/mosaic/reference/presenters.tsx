import { BookImage, ChevronUp } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"
import { Kbd } from "@/components/ui/kbd"
import { showsCode } from "@/lib/variable-label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

// The three reference-panel directions (Explorations rows 1 and 1.5, where
// the bottom dock is labelled D; it became B on 2026-10-29):
//   A  Docked column: 360 px, right of the pane, full height
//   B  Bottom dock: a strip across the bottom of the pane
//   C  Inline expansion under the focused row; the rows below move down
// Each takes the same data; only the arrangement differs.

// The preview is shared with the row's state buttons (preview-context), so
// arrowing through states in the row shows them here, and hovering here
// outlines them in the row. Clicking a drawing selects that state; clicking
// the selected one again clears the score, as the row's buttons do.
function useStates(data: ReferenceData) {
  const id = data.variable.id
  const p = usePreviewFor(id)
  const { dispatch } = useWorkup()
  return {
    preview: p.code,
    onPreview: (code: string | null) => (code ? p.show(code, "hover") : p.clear("hover")),
    onSelect: (code: string) =>
      dispatch(code === data.value ? { type: "clear", id } : { type: "enter", id, value: code }),
  }
}

// A click in the docked column or the bottom dock leaves focus there (or on
// <body>, in Safari, or when the panel closes under the pointer), and the
// data-entry keys stop working until a field is clicked (feedback
// 2026-11-09). After any click or focus in the panel, focus goes back to the
// stop the Workup is on. A dialog opened from the panel (the enlarged
// drawing) keeps focus until it closes.
function useReturnFocus<T extends HTMLElement = HTMLElement>() {
  const { refocus } = useWorkup()
  const ref = useRef<T>(null)
  const settle = () =>
    requestAnimationFrame(() => {
      const a = document.activeElement
      if (!a || a === document.body || ref.current?.contains(a)) refocus()
    })
  return { ref, onClick: settle, onFocus: settle }
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

// Shown while the panel is on but focus isn't on a field (a bone header,
// Conditions, Continue).
function Placeholder({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground ${compact ? "h-full p-4" : "p-8"}`}>
      <BookImage className="size-6" />
      <span className="text-sm font-medium text-foreground">Reference panel</span>
      <span className="text-xs">Select a field row to see its drawings and definition.</span>
    </div>
  )
}

// 360 px; 300 px below 1280; below 1024 a drawer over the pane, so the rows
// keep their width (requirements: "collapses to a drawer"). Its left edge
// drags to make it wider (feedback 2026-11-09); the drawings grow with it
// (container queries), and the width is kept in this browser. A double-click
// on the edge goes back to the default.
const DOCKED_CLASS =
  "@container relative flex w-[360px] shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-6 max-xl:w-[300px] max-xl:p-5 " +
  "max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20 max-lg:w-[320px] max-lg:shadow-xl"

const WIDTH_KEY = "mosaic-proto:reference-width"
export const DOCKED_MIN = 300
const maxWidth = () => Math.max(DOCKED_MIN, Math.min(800, Math.round(window.innerWidth * 0.6)))
const clampWidth = (w: number) => Math.min(maxWidth(), Math.max(DOCKED_MIN, Math.round(w)))

function useDockedWidth() {
  const [width, setWidth] = useState<number | null>(() => {
    try {
      const n = Number(localStorage.getItem(WIDTH_KEY))
      return n ? clampWidth(n) : null
    } catch {
      return null
    }
  })
  const save = (w: number | null) => {
    setWidth(w)
    try {
      if (w === null) localStorage.removeItem(WIDTH_KEY)
      else localStorage.setItem(WIDTH_KEY, String(w))
    } catch {
      // ignore
    }
  }
  return { width, setWidth, save }
}

function DockedShell({ children }: { children: ReactNode }) {
  const { width, setWidth, save } = useDockedWidth()
  const back = useReturnFocus<HTMLElement>()
  const asideRef = back.ref
  const drag = useRef<{ x: number; w: number } | null>(null)
  return (
    <aside
      ref={asideRef}
      aria-label="Reference"
      className={DOCKED_CLASS}
      style={width ? { width } : undefined}
      onClick={back.onClick}
      onFocus={back.onFocus}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize reference panel"
        aria-valuenow={width ?? undefined}
        aria-valuemin={DOCKED_MIN}
        title="Drag to resize · double-click to reset"
        data-testid="reference-resize"
        className="group/resize absolute inset-y-0 left-0 z-10 w-2 -translate-x-1 cursor-col-resize touch-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, w: asideRef.current?.offsetWidth ?? 360 }
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          setWidth(clampWidth(drag.current.w + drag.current.x - e.clientX))
        }}
        onPointerUp={(e) => {
          if (!drag.current) return
          drag.current = null
          e.currentTarget.releasePointerCapture(e.pointerId)
          save(asideRef.current?.offsetWidth ?? null)
        }}
        onDoubleClick={() => save(null)}
      >
        <span className="absolute inset-y-0 left-1 w-0.5 bg-transparent transition-colors group-hover/resize:bg-ring group-active/resize:bg-ring" />
      </div>
      {children}
    </aside>
  )
}

export function DockedColumn({ data, onClose }: { data: ReferenceData | null; onClose: () => void }) {
  if (!data) {
    return (
      <DockedShell>
        <PanelHeader label="Reference" onClose={onClose} />
        <Placeholder />
      </DockedShell>
    )
  }
  return (
    <DockedShell>
      <DockedColumnFor data={data} onClose={onClose} />
    </DockedShell>
  )
}

function DockedColumnFor({ data, onClose }: { data: ReferenceData; onClose: () => void }) {
  const v = data.variable
  const states = useStates(data)
  const preview = states.preview
  return (
    <>
      <PanelHeader label="Reference" entry={data.entry} onClose={onClose} />
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{v.name}</span>
        {showsCode(v) && <span className="font-mono text-xs text-muted-foreground">{v.code}</span>}
      </div>
      {v.modality === "morph" ? (
        <>
          <LargeState data={data} states={states} className="h-[220px] @min-[440px]:h-[300px] @min-[580px]:h-[400px]" />
          <StateStrip
            data={data}
            preview={preview}
            onPreview={states.onPreview}
            onSelect={states.onSelect}
            thumbClassName="h-24 @min-[440px]:h-32 @min-[580px]:h-40"
          />
          <p className="text-xs text-muted-foreground">{morphHint}</p>
        </>
      ) : (
        <>
          <MetricFigure data={data} className="h-[160px] @min-[440px]:h-[240px] @min-[580px]:h-[320px]" />
          <p className="text-xs text-muted-foreground">Measurement drawing. Click the drawing to enlarge.</p>
        </>
      )}
      <p className="text-sm">{definitionOf(v)}</p>
      {v.modality === "metric" && <Facts items={factsOf(data)} />}
      <MoreSection v={v} />
    </>
  )
}

export function InlineExpansion({ data, onClose }: { data: ReferenceData; onClose: () => void }) {
  const v = data.variable
  const states = useStates(data)
  const preview = states.preview
  const wide = data.entry.kind === "figure" && data.entry.figure.width / data.entry.figure.height > 2
  return (
    // Attached to the row above as one shape: full row width, square top
    // corners, a hairline between them, and the image lined up with the
    // Variable name (row padding + status icon + gap = 40 px). Image beside
    // the text; on narrow panes (and for 3:1 long-bone figures) the image
    // goes on top at full width.
    <div className="@container w-full pb-2">
      <div
        className={`flex flex-col gap-5 rounded-b-lg border-t bg-muted/50 p-4 pl-10 max-md:pl-4 ${wide ? "" : "@min-[560px]:flex-row"}`}
      >
        {v.modality === "morph" ? (
          <LargeState data={data} states={states} className="h-[190px] w-full shrink-0 @min-[560px]:w-[280px]" />
        ) : (
          <MetricFigure data={data} className={wide ? "h-[200px] w-full" : "h-[182px] w-full shrink-0 @min-[560px]:w-[218px]"} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <PanelHeader label={`Reference · ${showsCode(v) ? v.code : v.name}`} entry={data.entry} onClose={onClose} />
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
export const DOCK_STRIP_HEIGHT = 36

const DOCK_CLASS =
  "@container absolute inset-x-0 bottom-0 z-10 flex gap-4 border-t bg-background px-4 pt-4 pb-5 shadow-[0_-4px_12px_-4px_rgb(12_23_62/0.08)] lg:gap-5 lg:px-10 lg:pt-5 lg:pb-6"

// The bottom dock while it's off: a thin strip along the bottom of the pane
// that says what it is (with more on hover) and opens it.
export function DockStrip({ onOpen }: { onOpen: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          onClick={onOpen}
          aria-label="Show reference panel"
          className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2 border-t bg-muted px-4 text-xs text-muted-foreground hover:text-foreground lg:px-10"
          style={{ height: DOCK_STRIP_HEIGHT }}
        >
          <BookImage className="size-4" />
          <span className="font-medium">Reference panel</span>
          <span className="hidden sm:inline">· drawings and definitions for the field you're on</span>
          <ChevronUp className="ml-auto size-4" />
          <Kbd>R</Kbd>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        Opens a strip here with the reference drawings and definition for the selected field. It stays open as you move
        between fields until you close it. Shortcut: R.
      </TooltipContent>
    </Tooltip>
  )
}

export function BottomDock({ data, onClose }: { data: ReferenceData | null; onClose: () => void }) {
  const back = useReturnFocus<HTMLDivElement>()
  if (!data) {
    return (
      <div
        ref={back.ref}
        className={DOCK_CLASS}
        style={{ height: DOCK_HEIGHT }}
        aria-label="Reference"
        onClick={back.onClick}
        onFocus={back.onFocus}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <PanelHeader label="Reference" onClose={onClose} />
          <Placeholder compact />
        </div>
      </div>
    )
  }
  return (
    <div
      ref={back.ref}
      className={DOCK_CLASS}
      style={{ height: DOCK_HEIGHT }}
      aria-label="Reference"
      onClick={back.onClick}
      onFocus={back.onFocus}
    >
      <BottomDockFor data={data} onClose={onClose} />
    </div>
  )
}

function BottomDockFor({ data, onClose }: { data: ReferenceData; onClose: () => void }) {
  const v = data.variable
  const states = useStates(data)
  const preview = states.preview
  return (
    <>
      {v.modality === "morph" ? (
        // Shares of the dock rather than fixed widths, so it never spills.
        <LargeState data={data} states={states} className="h-full w-[30%] max-w-[240px] min-w-[140px] shrink-0" />
      ) : (
        <MetricFigure data={data} className="h-full w-[45%] max-w-[520px] min-w-[200px] shrink-0" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <PanelHeader label={`Reference · ${showsCode(v) ? `${v.name} (${v.code})` : v.name}`} entry={data.entry} onClose={onClose} />
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
    </>
  )
}

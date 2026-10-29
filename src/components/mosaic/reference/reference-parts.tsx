import { ChevronDown, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { imageUrl } from "@/data"
import type { Highlight, ImageAsset, ReferenceEntry, Variable } from "@/data/types"
import { cn } from "@/lib/utils"

// Building blocks of the reference panel, shared by the three presenters
// (Explorations rows 1 and 1.5). Images come from the manifest; on the public
// build, where real images aren't shipped, a placeholder keeps their size.

export type ReferenceData = {
  variable: Variable
  entry: ReferenceEntry
  // The field's current value: the selected Character state for Morph.
  value: string | null
}

export function PanelHeader({ label, onClose }: { label: string; onClose?: () => void }) {
  const [mode, setMode] = useState<"Drawings" | "Photos">("Drawings")
  return (
    <div className="flex h-8 items-center gap-2">
      <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{label}</span>
      <div className="ml-auto flex gap-0.5">
        {(["Drawings", "Photos"] as const).map((m) => (
          <Button
            key={m}
            size="sm"
            tabIndex={-1}
            variant={mode === m ? "secondary" : "ghost"}
            className="text-xs"
            onClick={() => setMode(m)}
          >
            {m}
          </Button>
        ))}
      </div>
      {onClose && (
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label="Close reference" onClick={onClose}>
          <X />
        </Button>
      )}
    </div>
  )
}

// One image (or its placeholder) at a fixed box, with an Enlarge button. By
// default Enlarge opens the image alone; `onEnlarge` replaces that (a Morph
// field opens its state viewer instead).
export function RefImage({
  asset,
  caption,
  highlight,
  className,
  fit = "contain",
  onEnlarge,
}: {
  asset: ImageAsset | null
  caption: string
  highlight?: Highlight
  className?: string
  fit?: "contain" | "cover"
  onEnlarge?: () => void
}) {
  const [bigOwn, setBig] = useState(false)
  const big = bigOwn && !onEnlarge
  const enlarge = () => (onEnlarge ? onEnlarge() : setBig(true))
  const body = (large: boolean) => <ImageBody asset={asset} caption={caption} highlight={highlight} fit={fit} large={large} />
  return (
    <>
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted p-3", asset && imageUrl(asset) && "bg-white", className)}>
        <button type="button" tabIndex={-1} className="size-full cursor-zoom-in" onClick={enlarge}>
          {body(false)}
        </button>
        <Button
          variant="outline"
          size="icon"
          tabIndex={-1}
          aria-label="Enlarge"
          className="absolute top-2 right-2"
          onClick={enlarge}
        >
          <Maximize2 />
        </Button>
      </div>
      <Dialog open={big} onOpenChange={setBig}>
        <DialogContent className="sm:max-w-[min(1100px,calc(100vw-4rem))]">
          <DialogTitle className="text-base">{caption}</DialogTitle>
          <div className="h-[70vh] rounded-lg border bg-white p-4">{body(true)}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ImageBody({
  asset,
  caption,
  highlight,
  fit = "contain",
  large,
}: {
  asset: ImageAsset | null
  caption: string
  highlight?: Highlight
  fit?: "contain" | "cover"
  large: boolean
}) {
  const url = asset ? imageUrl(asset) : null
  return (
    <div className="relative flex size-full items-center justify-center">
      {url ? (
        <div className="relative max-h-full max-w-full" style={{ aspectRatio: `${asset!.width} / ${asset!.height}` }}>
          <img src={url} alt={caption} className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain")} />
          {highlight && <HighlightBox h={highlight} />}
        </div>
      ) : (
        <div
          className="relative flex max-h-full max-w-full flex-col items-center justify-center gap-2 text-muted-foreground"
          style={asset ? { aspectRatio: `${asset.width} / ${asset.height}`, width: "100%" } : undefined}
        >
          <ImageIcon className={large ? "size-10" : "size-6"} />
          <span className="text-center text-xs">{caption}</span>
          {highlight && <HighlightBox h={highlight} />}
        </div>
      )}
    </div>
  )
}

function HighlightBox({ h }: { h: Highlight }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-sm bg-destructive/10 ring-2 ring-destructive"
      style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%`, width: `${h.w * 100}%`, height: `${h.h * 100}%` }}
    />
  )
}

// Thumbnails of every Character state. They mirror the row's state buttons:
// the selected state is filled, a previewed one is outlined, hovering here
// previews it in both places, and clicking a drawing selects that state
// (clicking the selected one again clears it).
export function StateStrip({
  data,
  preview,
  onPreview,
  onSelect,
  thumbClassName,
  showImages = true,
}: {
  data: ReferenceData
  preview: string | null
  onPreview: (code: string | null) => void
  onSelect?: (code: string) => void
  thumbClassName?: string
  showImages?: boolean
}) {
  const states = data.variable.states ?? []
  const assets = data.entry.kind === "states" ? data.entry.states : {}
  return (
    <div className="flex gap-1.5" onMouseLeave={() => onPreview(null)}>
      {states.map((s) => {
        const url = assets[s.code] ? imageUrl(assets[s.code]) : null
        const selected = data.value === s.code
        return (
          <button
            key={s.code}
            type="button"
            tabIndex={-1}
            title={s.label ? `${s.code}: ${s.label}` : `State ${s.code}`}
            aria-pressed={selected}
            onMouseEnter={() => onPreview(s.code)}
            // Keep focus on the field, so typing carries on after a click.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect?.(s.code)}
            className={cn(
              "flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border bg-muted p-1.5 hover:border-primary/60",
              url && "bg-white",
              selected && "border-primary",
              preview === s.code && "ring-2 ring-primary",
              thumbClassName,
            )}
          >
            {showImages && url && <img src={url} alt="" className="min-h-0 w-full flex-1 object-contain" />}
            <span
              className={cn(
                "rounded px-1.5 text-xs text-muted-foreground",
                selected && "bg-primary font-medium text-primary-foreground",
              )}
            >
              {s.code}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export type StateHandlers = {
  preview: string | null
  onPreview: (code: string | null) => void
  onSelect: (code: string) => void
}

const stateAsset = (data: ReferenceData, code: string | undefined) =>
  data.entry.kind === "states" ? data.entry.states[code ?? ""] ?? null : null

const stateCaption = (data: ReferenceData, code: string | undefined) => {
  const state = data.variable.states?.find((s) => s.code === code)
  return `State ${code}${state?.label ? `: ${state.label}` : ""}`
}

// The large image for a Morph Variable: the previewed, selected or first
// state. Enlarging it opens the state viewer.
export function LargeState({
  data,
  states: handlers,
  className,
}: {
  data: ReferenceData
  states: StateHandlers
  className?: string
}) {
  const [viewer, setViewer] = useState(false)
  const preview = handlers.preview
  const states = data.variable.states ?? []
  const code = preview ?? data.value ?? states[0]?.code
  const how = preview ? "previewing" : data.value ? "selected" : "first"
  return (
    <>
      <RefImage
        asset={stateAsset(data, code)}
        caption={`Drawing · ${stateCaption(data, code)} (${how})`}
        className={className}
        onEnlarge={() => setViewer(true)}
      />
      {viewer && (
        <StateViewer data={data} start={code} handlers={handlers} onClose={() => setViewer(false)} />
      )}
    </>
  )
}

// The enlarged drawing for a Morph field, with every state as a captioned
// thumbnail underneath. Clicking a thumbnail (or ←/→) shows it large; the
// shown state is outlined here and in the row, like a preview. "Choose"
// (or Enter) scores the field with it; on the chosen state it clears the
// score instead, as clicking a chosen state does elsewhere.
function StateViewer({
  data,
  start,
  handlers,
  onClose,
}: {
  data: ReferenceData
  start: string | undefined
  handlers: StateHandlers
  onClose: () => void
}) {
  const states = data.variable.states ?? []
  const [viewing, setViewing] = useState(start ?? states[0]?.code)
  const at = Math.max(0, states.findIndex((s) => s.code === viewing))
  const step = (d: number) => setViewing(states[(at + d + states.length) % states.length]?.code)
  const chosen = viewing !== undefined && viewing === data.value

  // Mirror the shown state into the shared preview, so the row and the panel
  // follow along; clear it on close.
  const preview = useRef(handlers.onPreview)
  preview.current = handlers.onPreview
  useEffect(() => {
    preview.current(viewing ?? null)
  }, [viewing])
  useEffect(() => () => preview.current(null), [])

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="flex max-h-[calc(100vh-4rem)] flex-col gap-4 sm:max-w-[min(1100px,calc(100vw-4rem))]"
        // The viewer's keys must not reach the data-entry shortcuts.
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault()
            step(e.key === "ArrowLeft" ? -1 : 1)
          } else if (e.key === "Enter" && viewing) {
            e.preventDefault()
            handlers.onSelect(viewing)
          }
        }}
        // Focus the viewer itself, not its first button, so ←/→ and Enter work
        // straight away without a ring on "Previous".
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)?.focus()
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-base">
            {data.variable.name} · {stateCaption(data, viewing)}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {data.value ? `Chosen: state ${data.value}.` : "Not scored yet."} ←/→ or click a thumbnail to compare; Enter
            chooses the one shown.
          </DialogDescription>
        </div>
        <div className="relative h-[55vh] min-h-48 rounded-lg border bg-white p-4">
          <ImageBody asset={stateAsset(data, viewing)} caption={stateCaption(data, viewing)} large />
          {states.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous state"
                className="absolute top-1/2 left-3 -translate-y-1/2"
                onClick={() => step(-1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next state"
                className="absolute top-1/2 right-3 -translate-y-1/2"
                onClick={() => step(1)}
              >
                <ChevronRight />
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="States">
          {states.map((s) => {
            const asset = stateAsset(data, s.code)
            const url = asset ? imageUrl(asset) : null
            const selected = data.value === s.code
            return (
              <button
                key={s.code}
                type="button"
                role="option"
                aria-selected={viewing === s.code}
                aria-label={stateCaption(data, s.code)}
                onClick={() => setViewing(s.code)}
                onDoubleClick={() => handlers.onSelect(s.code)}
                className={cn(
                  "flex w-32 shrink-0 flex-col gap-1.5 rounded-lg border p-1.5 text-left hover:border-primary/60",
                  selected && "border-primary",
                  viewing === s.code && "ring-2 ring-primary",
                )}
              >
                <span className={cn("flex h-20 items-center justify-center rounded bg-muted", url && "bg-white")}>
                  {url ? (
                    <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </span>
                <span className="flex items-start gap-1.5 text-xs">
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 font-medium text-muted-foreground",
                      selected && "bg-primary text-primary-foreground",
                    )}
                  >
                    {s.code}
                  </span>
                  <span className="line-clamp-2 text-muted-foreground">{s.label || "No description yet"}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={chosen ? "outline" : "default"}
            disabled={!viewing}
            onClick={() => viewing && handlers.onSelect(viewing)}
          >
            {chosen ? `Unselect state ${viewing}` : `Choose state ${viewing}`}
            <Kbd className={chosen ? "" : "bg-primary-foreground/20 text-primary-foreground"}>Enter</Kbd>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MetricFigure({ data, className }: { data: ReferenceData; className?: string }) {
  if (data.entry.kind !== "figure") {
    return (
      <div className={cn("flex items-center justify-center rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground", className)}>
        No drawing for {data.variable.code} yet
      </div>
    )
  }
  return (
    <RefImage
      asset={data.entry.figure}
      caption={`${data.entry.caption} · DCP #${data.variable.dcp}`}
      highlight={data.entry.highlight}
      className={className}
    />
  )
}

export const morphHint =
  "Hover a drawing, or use ←/→ on the field, to preview a state; click a drawing (or press Enter) to choose it, and click it again to clear. Click the large image to enlarge and compare states."

export function definitionOf(v: Variable): string {
  if (v.modality === "metric") {
    // Instrument and precision are listed beside it (Facts).
    const d = v.definition ?? v.fullName ?? v.name
    return /[.)]$/.test(d) ? d : `${d}.`
  }
  const states = v.states?.map((s) => `${s.code} ${s.label}`).join(" · ")
  return `${v.name}: score the closest of ${v.states?.length} states. ${states}.`
}

export function MoreSection({ v }: { v: Variable }) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" tabIndex={-1} className="group/more -ml-3 w-fit text-xs">
          <ChevronDown className="transition-transform group-data-[state=open]/more:rotate-180" />
          More: orientation, what to consider, citations
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 text-xs text-muted-foreground">
        {v.modality === "metric"
          ? `${v.fullName ?? v.name} (DCP 2.0 #${v.dcp}). Orientation notes and citations come with the reference delivery.`
          : `Method: ${v.method || "—"}. Orientation notes and citations come with the reference delivery.`}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {items.map(([k, val]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd>{val}</dd>
        </div>
      ))}
    </dl>
  )
}

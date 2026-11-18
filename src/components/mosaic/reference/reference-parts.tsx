import { ChevronDown, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X } from "lucide-react"
import { useWorkup } from "@/workup/workup-context"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { sections } from "@/domain/workup"
import { showsCode, stateLabel } from "@/lib/variable-label"
import { imageUrl } from "@/data"
import type { Highlight, ImageAsset, ReferenceEntry, Variable } from "@/data/types"
import { cn } from "@/lib/utils"
import { useEnlargeRequest } from "@/workup/enlarge-request"
import { effectiveMedia, examplesOf, hasDrawings, hasPhotos, setRefMedia, useRefMedia, type RefMedia } from "@/workup/ref-media"

// Building blocks of the reference panel, shared by the three presenters
// (Explorations rows 1 and 1.5). Images come from the manifest; on the public
// build, where real images aren't shipped, a placeholder keeps their size.

export type ReferenceData = {
  variable: Variable
  entry: ReferenceEntry
  // The field's current value: the selected Character state for Morph.
  value: string | null
}

export function PanelHeader({ label, entry, onClose }: { label: string; entry?: ReferenceEntry; onClose?: () => void }) {
  return (
    <div className="flex h-8 items-center gap-2">
      <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{label}</span>
      <MediaToggle entry={entry} className="ml-auto" />
      {onClose && (
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label="Close reference" onClick={onClose}>
          <X />
        </Button>
      )}
    </div>
  )
}

// Drawings / Photos. The choice stays as set across fields; a Variable
// without photos (or without drawings) shows what it has, and the other
// button is disabled.
function MediaToggle({ entry, className }: { entry?: ReferenceEntry; className?: string }) {
  const chosen = useRefMedia()
  const shown = entry ? effectiveMedia(entry, chosen) : chosen
  const available: Record<RefMedia, boolean> = {
    drawings: !entry || entry.kind !== "states" || hasDrawings(entry),
    photos: !!entry && hasPhotos(entry),
  }
  return (
    <div className={cn("flex gap-0.5", className)}>
      {(["drawings", "photos"] as const).map((m) => (
        <Button
          key={m}
          size="sm"
          tabIndex={-1}
          variant={shown === m ? "secondary" : "ghost"}
          className="text-xs capitalize"
          disabled={!available[m]}
          title={available[m] ? undefined : `No ${m} for this field yet`}
          aria-pressed={shown === m}
          aria-label={m === "photos" ? "Photos" : "Drawings"}
          aria-keyshortcuts={m[0].toUpperCase()}
          onClick={() => setRefMedia(m)}
        >
          {m}
          <Kbd className="h-4 min-w-4 px-1 text-[10px] uppercase">{m[0]}</Kbd>
        </Button>
      ))}
    </div>
  )
}

// ‹ 1 / 3 › over an image, for states with several examples.
function ExampleNav({ at, count, onStep, keys }: { at: number; count: number; onStep: (d: number) => void; keys?: boolean }) {
  if (count < 2) return null
  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-md border bg-background/95 text-xs text-muted-foreground shadow-sm">
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label="Previous example" className="size-6" onClick={() => onStep(-1)}>
          <ChevronLeft />
        </Button>
        <span className="px-1 tabular-nums">
          {at + 1} of {count}
        </span>
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label="Next example" className="size-6" onClick={() => onStep(1)}>
          <ChevronRight />
        </Button>
        {keys && <Kbd className="mr-1">↑↓</Kbd>}
      </div>
    </div>
  )
}

// The examples of one state in the media shown, and which one is up. Goes
// back to the first when the state or media changes.
function useExamples(entry: ReferenceEntry, code: string | undefined) {
  const media = effectiveMedia(entry, useRefMedia())
  const list = examplesOf(entry, media, code)
  const key = `${media}:${code}`
  const [pos, setPos] = useState({ key, at: 0 })
  const at = pos.key === key ? Math.min(pos.at, Math.max(0, list.length - 1)) : 0
  return {
    media,
    list,
    at,
    asset: list[at] ?? null,
    step: (d: number) => setPos({ key, at: (at + d + list.length) % Math.max(1, list.length) }),
  }
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
  overlay,
  enlargeFor,
  enlargeLabel = "Enlarge",
}: {
  asset: ImageAsset | null
  caption: string
  highlight?: Highlight
  className?: string
  fit?: "contain" | "cover"
  onEnlarge?: (code?: string) => void
  overlay?: ReactNode
  // The field this image belongs to: E on that field enlarges it.
  enlargeFor?: string
  enlargeLabel?: string
}) {
  const [bigOwn, setBig] = useState(false)
  const big = bigOwn && !onEnlarge
  const enlarge = (code?: string) => (onEnlarge ? onEnlarge(code) : setBig(true))
  useEnlargeRequest(enlargeFor, enlarge)
  const body = (large: boolean) => <ImageBody asset={asset} caption={caption} highlight={highlight} fit={fit} large={large} />
  return (
    <>
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted p-3", asset && imageUrl(asset) && "bg-white", className)}>
        <button type="button" tabIndex={-1} className="size-full cursor-zoom-in" onClick={() => enlarge()}>
          {body(false)}
        </button>
        <Button
          variant="outline"
          size="sm"
          tabIndex={-1}
          aria-label="Enlarge"
          aria-keyshortcuts={enlargeFor ? "E" : undefined}
          title={enlargeFor ? `${enlargeLabel} (E)` : enlargeLabel}
          className="absolute top-2 right-2 h-8 gap-1.5 px-2"
          onClick={() => enlarge()}
        >
          <Maximize2 />
          {enlargeFor && <Kbd className="h-4 min-w-4 px-1 text-[10px]">E</Kbd>}
        </Button>
        {overlay}
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
  const media = effectiveMedia(data.entry, useRefMedia())
  return (
    <div className="flex gap-1.5" onMouseLeave={() => onPreview(null)}>
      {states.map((s) => {
        const first = examplesOf(data.entry, media, s.code)[0]
        const url = first ? imageUrl(first) : null
        const selected = data.value === s.code
        return (
          <button
            key={s.code}
            type="button"
            tabIndex={-1}
            title={s.label ? `${s.code}: ${stateLabel(s.label)}` : `State ${s.code}`}
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

const stateCaption = (data: ReferenceData, code: string | undefined) => {
  const state = data.variable.states?.find((s) => s.code === code)
  return `State ${code}${state?.label ? `: ${stateLabel(state.label)}` : ""}`
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
  // Open, and on which state (E passes the one in focus when it was pressed).
  const [viewer, setViewer] = useState<{ start: string | undefined } | null>(null)
  const preview = handlers.preview
  const states = data.variable.states ?? []
  const code = preview ?? data.value ?? states[0]?.code
  const how = preview ? "previewing" : data.value ? "selected" : "first"
  const ex = useExamples(data.entry, code)
  return (
    <>
      <RefImage
        asset={ex.asset}
        caption={`${ex.media === "photos" ? "Photo" : "Drawing"} · ${stateCaption(data, code)} (${how})`}
        className={className}
        onEnlarge={(c) => setViewer({ start: c ?? code })}
        enlargeFor={data.variable.id}
        enlargeLabel="Compare states"
        overlay={<ExampleNav at={ex.at} count={ex.list.length} onStep={ex.step} />}
      />
      {viewer && (
        <StateViewer data={data} start={viewer.start} handlers={handlers} onClose={() => setViewer(null)} />
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
  const ex = useExamples(data.entry, viewing)
  const { refocus } = useWorkup()
  const section = sections.find((x) => x.bones.some((b) => b.variableIds.includes(data.variable.id)))
  const viewedLabel = states.find((s) => s.code === viewing)?.label
  const scoredLabel = states.find((s) => s.code === data.value)?.label

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
          } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && ex.list.length > 1) {
            e.preventDefault()
            ex.step(e.key === "ArrowUp" ? -1 : 1)
          } else if (e.key === "Enter" && viewing) {
            e.preventDefault()
            handlers.onSelect(viewing)
          } else if ((e.code === "KeyD" || e.code === "KeyP") && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault()
            setRefMedia(e.code === "KeyP" ? "photos" : "drawings")
          }
        }}
        // Focus the viewer itself, not its first button, so ←/→ and Enter work
        // straight away without a ring on "Previous".
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement | null)?.focus()
        }}
        // Back to the field, so the data-entry keys work again.
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          refocus()
        }}
      >
        {/* Header: only what doesn't change while browsing, the trait and
            where it sits. The state on screen is captioned under the image;
            the score sits in the footer beside the button that changes it. */}
        <div className="flex min-w-0 flex-col gap-0.5 pr-8">
          {section && <span className="text-xs text-muted-foreground">{section.title}</span>}
          <DialogTitle className="flex items-baseline gap-2 text-base">
            {data.variable.name}
            {showsCode(data.variable) && (
              <span className="font-mono text-xs font-normal text-muted-foreground">{data.variable.code}</span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Compare the states of {data.variable.name} and choose one.
          </DialogDescription>
        </div>
        <div className="flex min-h-0 flex-col gap-3">
          <div className="relative h-[50vh] min-h-48 rounded-lg border bg-white p-4">
            <ImageBody asset={ex.asset} caption={stateCaption(data, viewing)} large />
            {/* Drawings / Photos changes this image, so it sits on it. */}
            <MediaToggle entry={data.entry} className="absolute top-2 right-2 rounded-md border bg-background/95 p-0.5 shadow-xs" />
            <ExampleNav at={ex.at} count={ex.list.length} onStep={ex.step} keys />
            {states.length > 1 &&
              ([-1, 1] as const).map((d) => (
                <div
                  key={d}
                  className={cn("absolute top-1/2 flex -translate-y-1/2 flex-col items-center gap-1", d < 0 ? "left-3" : "right-3")}
                >
                  <Button variant="outline" size="icon" aria-label={d < 0 ? "Previous state" : "Next state"} onClick={() => step(d)}>
                    {d < 0 ? <ChevronLeft /> : <ChevronRight />}
                  </Button>
                  <Kbd>{d < 0 ? "←" : "→"}</Kbd>
                </div>
              ))}
          </div>
          {/* The state on screen, with its full description (the cards cut
              it to two lines). Announced as it changes. */}
          <div aria-live="polite" className="flex items-start gap-2.5">
            <span
              className={cn(
                "flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border px-1.5 text-sm font-medium",
                chosen && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {viewing}
            </span>
            <p className={cn("min-w-0 flex-1 text-sm leading-6", !viewedLabel && "text-muted-foreground italic")}>
              {viewedLabel ? stateLabel(viewedLabel) : "No description yet"}
            </p>
            {chosen && <Badge className="mt-0.5 shrink-0">Scored</Badge>}
          </div>
        </div>
        {/* Padding keeps the cards' selection rings and offset badges inside
            the scroll area, which would otherwise clip them. */}
        <div className="flex gap-3 overflow-x-auto px-2 pt-2.5 pb-2" role="listbox" aria-label="States">
          {states.map((s) => {
            const asset = examplesOf(data.entry, ex.media, s.code)[0]
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
                  "relative flex w-32 shrink-0 flex-col rounded-lg border bg-background text-left hover:border-primary/60",
                  selected && "border-primary",
                  viewing === s.code && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                )}
              >
                {/* The number sits on the card's corner, off the caption. */}
                <span
                  className={cn(
                    "absolute -top-2 -left-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-md border bg-background px-1 text-xs font-medium shadow-xs",
                    selected && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {s.code}
                </span>
                <span className={cn("flex h-20 items-center justify-center rounded-t-lg border-b bg-muted p-1.5", url && "bg-white")}>
                  {url ? (
                    <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </span>
                {/* Padding on the wrapper: on the clamped line itself it would
                    show a sliver of a third line. */}
                <span className="px-2 py-1.5 text-xs">
                  <span className={cn("line-clamp-2", s.label ? "text-foreground" : "text-muted-foreground italic")}>
                    {s.label ? stateLabel(s.label) : "No description yet"}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 border-t pt-4">
          <p className="min-w-0 flex-1 truncate text-sm">
            {data.value ? (
              <>
                <span className="text-muted-foreground">Scored:</span>{" "}
                <span className="font-medium">
                  {data.value}
                  {scoredLabel ? ` · ${stateLabel(scoredLabel)}` : ""}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Not scored yet</span>
            )}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close <Kbd>Esc</Kbd>
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
      caption={data.variable.dcp ? `${data.entry.caption} · DCP #${data.variable.dcp}` : data.entry.caption}
      highlight={data.entry.highlight}
      className={className}
      enlargeFor={data.variable.id}
    />
  )
}

export const morphHint =
  "Hover a drawing, or use ←/→ on the field, to preview a state; click a drawing (or press Enter) to choose it, and click it again to clear. Click the large image, or press E, to enlarge and compare states."

export function definitionOf(v: Variable): string {
  if (v.modality === "metric") {
    // Instrument and precision are listed beside it (Facts).
    const d = v.definition ?? v.fullName ?? v.name
    return /[.)]$/.test(d) ? d : `${d}.`
  }
  const states = v.states?.map((s) => `${s.code} ${s.label}`).join(" · ")
  return `${v.name}: score the closest of ${v.states?.length} states. ${states}.`
}

// A Morph Variable's states as a list, one per line, so a state with no
// description reads as missing rather than running into the next one. The
// state being previewed or chosen is marked, as in the strip.
export function StateDefinitions({ data, preview }: { data: ReferenceData; preview: string | null }) {
  const v = data.variable
  if (v.modality !== "morph") return <p className="text-sm">{definitionOf(v)}</p>
  const states = v.states ?? []
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <p className="text-sm">
        {v.name}: score the closest of {states.length} states.
      </p>
      <ol className="flex flex-col gap-1">
        {states.map((s) => (
          <li
            key={s.code}
            className={cn(
              "flex items-start gap-2 rounded px-1 py-0.5 leading-5",
              preview === s.code && "bg-muted",
            )}
          >
            <span
              className={cn(
                // As tall as the text's first line, so the number sits centred on it.
                "flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1.5 text-xs font-medium text-muted-foreground",
                data.value === s.code && "bg-primary text-primary-foreground",
              )}
            >
              {s.code}
            </span>
            <span className={cn(!s.label && "text-muted-foreground italic")}>{s.label ? stateLabel(s.label) : "No description yet"}</span>
          </li>
        ))}
      </ol>
    </div>
  )
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
          ? `${v.fullName ?? v.name}${v.dcp ? ` (DCP 2.0 #${v.dcp})` : ""}. Orientation notes and citations come with the reference delivery.`
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

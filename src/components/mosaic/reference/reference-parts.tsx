import { ChevronDown, Image as ImageIcon, Maximize2, X } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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

// One image (or its placeholder) at a fixed box, with an Enlarge button.
export function RefImage({
  asset,
  caption,
  highlight,
  className,
  fit = "contain",
}: {
  asset: ImageAsset | null
  caption: string
  highlight?: Highlight
  className?: string
  fit?: "contain" | "cover"
}) {
  const [big, setBig] = useState(false)
  const url = asset ? imageUrl(asset) : null
  const body = (large: boolean) => (
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
  return (
    <>
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted p-3", url && "bg-white", className)}>
        <button type="button" tabIndex={-1} className="size-full cursor-zoom-in" onClick={() => setBig(true)}>
          {body(false)}
        </button>
        <Button
          variant="outline"
          size="icon"
          tabIndex={-1}
          aria-label="Enlarge"
          className="absolute top-2 right-2"
          onClick={() => setBig(true)}
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
// previews it in both places, and clicking a drawing selects that state.
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

// The large image for a Morph Variable: the previewed, selected or first state.
export function LargeState({
  data,
  preview,
  className,
}: {
  data: ReferenceData
  preview: string | null
  className?: string
}) {
  const states = data.variable.states ?? []
  const code = preview ?? data.value ?? states[0]?.code
  const state = states.find((s) => s.code === code)
  const asset = data.entry.kind === "states" ? data.entry.states[code ?? ""] ?? null : null
  const how = preview ? "previewing" : data.value ? "selected" : "first"
  return (
    <RefImage
      asset={asset}
      caption={`Drawing · state ${code}${state ? `, ${state.label}` : ""} (${how})`}
      className={className}
    />
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
  "Hover a drawing, or use ←/→ on the field, to preview a state; click a drawing (or press Enter) to choose it. Click the large image to enlarge."

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

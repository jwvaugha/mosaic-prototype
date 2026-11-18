import { BookImage, Eraser, FilePlus, Flag, FlagOff, MinusCircle, MoreHorizontal, Undo2 } from "lucide-react"
import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { FLAG_KEYS } from "@/lib/keys"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// A row's trailing actions: Skip, come back to (flag), Clear for a scored
// Morphological field, then the Reference and Note icons. They're buttons
// that show their shortcut, so they work with the mouse as well as the keys.
//
// They take whatever space is left after the field's input. When it fits
// them all they show inline; otherwise every one of them folds into a single
// "⋯" menu, which needs 36 px, so the row never wraps because of them. The fit
// is measured, not estimated: labels change (Flag / Unflag, key hints on or
// off) and a flag chip or note icon takes some of the row.

export type RowAction = {
  id: "skip" | "flag" | "clear"
  label: string
  keys: string
  icon: ReactNode
  onClick: () => void
}

export function rowActionList({
  skipped,
  flagged,
  scoredMorph,
  onSkip,
  onFlag,
  onClear,
}: {
  skipped: boolean
  flagged: boolean
  scoredMorph: boolean
  onSkip: () => void
  onFlag: () => void
  onClear: () => void
}): RowAction[] {
  const list: RowAction[] = []
  if (scoredMorph) list.push({ id: "clear", label: "Clear", keys: "⌫", icon: <Eraser />, onClick: onClear })
  list.push(
    skipped
      ? { id: "skip", label: "Un-skip", keys: "-", icon: <Undo2 />, onClick: onSkip }
      : { id: "skip", label: "Skip", keys: "-", icon: <MinusCircle />, onClick: onSkip },
  )
  list.push(
    flagged
      ? { id: "flag", label: "Unflag", keys: FLAG_KEYS, icon: <FlagOff />, onClick: onFlag }
      : { id: "flag", label: "Flag", keys: FLAG_KEYS, icon: <Flag />, onClick: onFlag },
  )
  return list
}

export function RowActions({
  actions,
  showKeyHints,
  onReference,
  onNote,
  hasNote,
}: {
  actions: RowAction[]
  showKeyHints: boolean
  // Present when the Variable has reference material.
  onReference?: () => void
  onNote?: () => void
  // A note's icon stays on the row itself, so it isn't repeated here.
  hasNote?: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const [fits, setFits] = useState(true)
  useLayoutEffect(() => {
    const b = box.current
    const r = row.current
    if (!b || !r) return
    // The inline set always lays out at its natural width (off-flow when it
    // doesn't fit), so both sides of the comparison stay measurable.
    const check = () => setFits(r.offsetWidth <= b.clientWidth)
    check()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(check)
    ro.observe(b)
    ro.observe(r)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="@container relative flex min-w-9 flex-1 justify-end">
      <div
        ref={row}
        aria-hidden={!fits || undefined}
        inert={!fits || undefined}
        className={cn(
          "flex w-max items-center gap-0.5",
          !fits && "pointer-events-none invisible absolute top-0 right-0",
        )}
      >
        {actions.map((a) => (
          <Button
            key={a.id}
            variant="ghost"
            size="xs"
            tabIndex={-1}
            onClick={a.onClick}
            className="text-xs font-normal text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-4"
          >
            {showKeyHints ? <Kbd>{a.keys}</Kbd> : a.icon}
            {a.label}
          </Button>
        ))}
        {onReference && (
          <IconAction label="Reference" shortcut="R" onClick={onReference}>
            <BookImage />
          </IconAction>
        )}
        {!hasNote && (
          <IconAction label="Add note" shortcut="N" onClick={onNote}>
            <FilePlus />
          </IconAction>
        )}
      </div>
      {!fits && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" tabIndex={-1} aria-label="More actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
            {actions.map((a) => (
              <DropdownMenuItem key={a.id} onSelect={a.onClick}>
                {a.icon}
                {a.label}
                <Kbd className="ml-auto">{a.keys}</Kbd>
              </DropdownMenuItem>
            ))}
            {onReference && (
              <DropdownMenuItem onSelect={onReference}>
                <BookImage />
                Reference
                <Kbd className="ml-auto">R</Kbd>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onNote}>
              <FilePlus />
              {hasNote ? "Edit note" : "Add note"}
              <Kbd className="ml-auto">N</Kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function IconAction({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut?: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label={label} onClick={onClick} className="[&_svg:not([class*='size-'])]:size-[18px]">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 opacity-70">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

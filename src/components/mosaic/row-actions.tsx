import { BookImage, Eraser, FilePlus, Flag, FlagOff, MinusCircle, MoreHorizontal, Undo2 } from "lucide-react"
import type { ReactNode } from "react"
import { FLAG_KEYS } from "@/lib/keys"
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
// them all (a CSS container query) they show inline; otherwise every one of
// them folds into a single "⋯" menu, which needs 36 px, so the row never
// wraps because of them.

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
      : { id: "flag", label: "Come back", keys: FLAG_KEYS, icon: <Flag />, onClick: onFlag },
  )
  return list
}

// Width needed to show everything inline. Buttons: Skip ≈ 70 px, Come back
// ≈ 146 (with "Option F"), Clear ≈ 76; icons 36 each. Icons are 16 px
// (18 for Reference and Note), larger than the button defaults (feedback
// 2026-11-09). Tailwind only sees literal class names,
// so each case is spelled out.
const FITS: Record<string, [string, string]> = {
  "0": ["hidden @min-[80px]:flex", "@min-[80px]:hidden"],
  "0r": ["hidden @min-[120px]:flex", "@min-[120px]:hidden"],
  "1": ["hidden @min-[154px]:flex", "@min-[154px]:hidden"],
  "1r": ["hidden @min-[194px]:flex", "@min-[194px]:hidden"],
  "2": ["hidden @min-[304px]:flex", "@min-[304px]:hidden"],
  "2r": ["hidden @min-[344px]:flex", "@min-[344px]:hidden"],
  "3": ["hidden @min-[382px]:flex", "@min-[382px]:hidden"],
  "3r": ["hidden @min-[422px]:flex", "@min-[422px]:hidden"],
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
  const [inline, folded] = FITS[`${Math.min(actions.length, 3)}${onReference ? "r" : ""}`]
  return (
    <div className="@container flex min-w-9 flex-1 justify-end">
      <div className={`items-center gap-0.5 ${inline}`}>
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
      <div className={folded}>
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
      </div>
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

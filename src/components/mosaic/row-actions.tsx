import { BookImage, Eraser, FilePlus, Flag, FlagOff, MinusCircle, MoreHorizontal, Undo2 } from "lucide-react"
import type { ReactNode } from "react"
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
      ? { id: "flag", label: "Unflag", keys: "⌥F", icon: <FlagOff />, onClick: onFlag }
      : { id: "flag", label: "Come back", keys: "⌥F", icon: <Flag />, onClick: onFlag },
  )
  return list
}

// Width needed to show everything inline. Buttons: Skip ≈ 66 px, Come back
// ≈ 102, Clear ≈ 72; icons 36 each. Tailwind only sees literal class names,
// so each case is spelled out.
const FITS: Record<string, [string, string]> = {
  "0": ["hidden @min-[80px]:flex", "@min-[80px]:hidden"],
  "0r": ["hidden @min-[120px]:flex", "@min-[120px]:hidden"],
  "1": ["hidden @min-[150px]:flex", "@min-[150px]:hidden"],
  "1r": ["hidden @min-[190px]:flex", "@min-[190px]:hidden"],
  "2": ["hidden @min-[256px]:flex", "@min-[256px]:hidden"],
  "2r": ["hidden @min-[296px]:flex", "@min-[296px]:hidden"],
  "3": ["hidden @min-[330px]:flex", "@min-[330px]:hidden"],
  "3r": ["hidden @min-[370px]:flex", "@min-[370px]:hidden"],
}

export function RowActions({
  actions,
  showKeyHints,
  onReference,
}: {
  actions: RowAction[]
  showKeyHints: boolean
  // Present when the Variable has reference material.
  onReference?: () => void
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
            className="text-xs font-normal text-muted-foreground hover:text-foreground"
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
        <IconAction label="Add note">
          <FilePlus />
        </IconAction>
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
            <DropdownMenuItem>
              <FilePlus />
              Add note
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
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label={label} onClick={onClick}>
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

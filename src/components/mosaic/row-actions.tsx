import { Eraser, Flag, FlagOff, MinusCircle, MoreHorizontal, Undo2 } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"

// A row's field actions: Skip, come back to (flag) and, for a scored
// Morphological field, Clear. They're buttons that show their shortcut, so
// they work with the mouse as well as the keyboard.
//
// They sit in the space left after the field's input. When that space fits
// them (a CSS container query), they show inline; when it doesn't (e.g. a
// trait with many states), they fold into a "⋯" menu.

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

export function RowActions({ actions, showKeyHints }: { actions: RowAction[]; showKeyHints: boolean }) {
  // Room needed to show them inline, about 95 px each. Tailwind only sees
  // literal class names, so both sizes are spelled out.
  const three = actions.length > 2
  return (
    <div className="@container flex min-w-0 flex-1 justify-end">
      <div className={three ? "hidden items-center gap-0.5 @min-[290px]:flex" : "hidden items-center gap-0.5 @min-[200px]:flex"}>
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
      </div>
      <div className={three ? "@min-[290px]:hidden" : "@min-[200px]:hidden"}>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

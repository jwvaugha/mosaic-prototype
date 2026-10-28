import { Flag } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { FLAG_REASONS, type FlagReason } from "@/domain/workup"
import { cn } from "@/lib/utils"

// WF / Come-back flag (Flows 2.1, 2.2). Sits in the gutter right of the row.
//   Offer:   dashed chip "Come back to this ⌥F", on hover or focus
//   Flagged: navy outline pill "Come back · <reason>"
// Flagging opens the optional reason popover without taking focus, so the
// keyboard flow carries on; it closes when focus leaves the row.

export function ComeBackFlag({
  name,
  flagged,
  reason,
  rowFocused,
  showKeyHints,
  onToggle,
  onReason,
}: {
  name: string
  flagged: boolean
  reason?: FlagReason
  rowFocused: boolean
  showKeyHints: boolean
  onToggle: () => void
  onReason: (r: FlagReason | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const wasFlagged = useRef(flagged)
  useEffect(() => {
    if (flagged && !wasFlagged.current && rowFocused) setOpen(true)
    if (!flagged) setOpen(false)
    wasFlagged.current = flagged
  }, [flagged, rowFocused])
  useEffect(() => {
    if (!rowFocused) setOpen(false)
  }, [rowFocused])

  if (!flagged) {
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-pressed={false}
        onClick={onToggle}
        className={cn(
          "flex h-[30px] items-center gap-1.5 rounded-md border border-dashed py-1 pr-1.5 pl-2 text-xs font-medium text-muted-foreground hover:bg-muted/50",
          "opacity-0 group-hover/gutter:opacity-100",
          rowFocused && "opacity-100",
        )}
      >
        <Flag className="size-3.5" />
        Come back to this
        {showKeyHints && <Kbd>⌥F</Kbd>}
      </button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button
          type="button"
          tabIndex={-1}
          aria-pressed
          onClick={() => setOpen((o) => !o)}
          className="mt-[3px] flex h-6 items-center gap-1.5 rounded-full border border-primary bg-background py-1 pr-2.5 pl-2 text-xs font-medium text-primary"
        >
          <Flag className="size-3.5" />
          {reason ? `Come back · ${FLAG_REASONS[reason]}` : "Come back to this"}
        </button>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="flex w-[300px] flex-col gap-2.5 px-3.5 py-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <span className="text-base font-semibold">Come back to {name}</span>
        <span className="text-xs text-muted-foreground">Why? (optional)</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FLAG_REASONS) as FlagReason[]).map((r) => (
            <Button
              key={r}
              size="sm"
              tabIndex={-1}
              variant={reason === r ? "default" : "outline"}
              className="text-xs"
              onClick={() => {
                onReason(reason === r ? undefined : r)
                setOpen(false)
              }}
            >
              {r === "other" ? "Other…" : FLAG_REASONS[r]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" tabIndex={-1} className="text-xs" onClick={onToggle}>
            Remove flag
          </Button>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Kbd>⌥F</Kbd> toggles
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

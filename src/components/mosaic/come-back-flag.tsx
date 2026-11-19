import { Flag } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { FLAG_KEYS } from "@/lib/keys"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { FLAG_REASONS, flagReasonLabel, type FlagReason } from "@/domain/workup"
import { Input } from "@/components/ui/input"
import { useWorkup } from "@/workup/workup-context"
import { cn } from "@/lib/utils"

// WF / Come-back flag (Flows 2.1, 2.2). Sits in the gutter right of the row.
//   Offer:   dashed chip "Flag ⌥F", on hover or focus
//   Flagged: highlighter-yellow flag icon; the reason is in its label and
//            tooltip
// Flagging opens the optional reason popover without taking focus, so the
// keyboard flow carries on; it closes when focus leaves the row. Choosing
// Other opens a text box below the reasons (and focuses it, since the user
// clicked there); Enter saves the text and closes, Esc closes.

export function ComeBackFlag({
  name,
  flagged,
  reason,
  text,
  rowFocused,
  showKeyHints,
  onToggle,
  onReason,
}: {
  name: string
  flagged: boolean
  reason?: FlagReason
  text?: string
  rowFocused: boolean
  showKeyHints: boolean
  onToggle: () => void
  onReason: (r: FlagReason | undefined, text?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { refocus } = useWorkup()
  const content = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(text ?? "")
  const wasFlagged = useRef(flagged)
  useEffect(() => {
    if (flagged && !wasFlagged.current && rowFocused) setOpen(true)
    if (!flagged) setOpen(false)
    wasFlagged.current = flagged
  }, [flagged, rowFocused])
  useEffect(() => {
    if (!rowFocused) setOpen(false)
  }, [rowFocused])

  const shown = flagReasonLabel(reason ? { reason, text } : null)
  const label = shown ? `Flagged · ${shown}` : "Flagged"

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
        <Flag className="size-4" />
        Flag
        {showKeyHints && <Kbd>{FLAG_KEYS}</Kbd>}
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
          aria-label={label}
          title={label}
          onClick={() => {
            // Each opening starts from the saved text.
            setDraft(text ?? "")
            setOpen((o) => !o)
          }}
          className="mt-[3px] flex size-6 items-center justify-center rounded-full border border-flag-border bg-flag text-flag-foreground"
        >
          <Flag className="size-3.5" />
        </button>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="flex w-[300px] flex-col gap-2.5 px-3.5 py-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
        ref={content}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          // Typing the reason took focus; hand it back to the field (the box
          // may already be gone, leaving focus on the page itself).
          const a = document.activeElement
          if (!a || a === document.body || content.current?.contains(a)) refocus()
        }}
      >
        <span className="text-base font-semibold">Flag {name}</span>
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
                if (r === "other" && reason !== "other") {
                  // Stays open for the text box.
                  onReason("other", draft)
                  return
                }
                onReason(reason === r ? undefined : r)
                setOpen(false)
              }}
            >
              {r === "other" ? "Other…" : FLAG_REASONS[r]}
            </Button>
          ))}
        </div>
        {reason === "other" && (
          <Input
            autoFocus
            aria-label="Other reason"
            placeholder="Why? e.g. needs better light"
            value={draft}
            className="h-8 text-sm"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft !== (text ?? "") && onReason("other", draft)}
            onKeyDown={(e) => {
              // Typing here mustn't reach the Workup's shortcuts.
              e.stopPropagation()
              if (e.key === "Enter") {
                e.preventDefault()
                onReason("other", draft)
                setOpen(false)
              } else if (e.key === "Escape") {
                e.preventDefault()
                setOpen(false)
              }
            }}
          />
        )}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" tabIndex={-1} className="text-xs" onClick={onToggle}>
            Remove flag
          </Button>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Kbd>{FLAG_KEYS}</Kbd> toggles
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

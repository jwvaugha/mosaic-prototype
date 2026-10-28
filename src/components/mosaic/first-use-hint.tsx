import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

// First-use hint (Flows 1.1): shown on the first focused field of a user's
// first Workup, anchored under the row, without taking focus. It goes away
// with "Got it" or once any field is marked.

export function FirstUseHint({
  open,
  title,
  body,
  note,
  keys,
  keyLabel,
  onDismiss,
  anchor,
}: {
  open: boolean
  title: string
  body: string
  note: string
  keys: string
  keyLabel: string
  onDismiss: () => void
  // The focused row; the hint hangs under it.
  anchor: HTMLElement | null
}) {
  return (
    <Popover open={open && !!anchor}>
      <PopoverAnchor virtualRef={{ current: anchor! }} />
      <PopoverContent
        side="bottom"
        align="end"
        className="flex w-[300px] flex-col gap-2.5 border-primary px-4 py-3.5"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <span className="text-base font-semibold">{title}</span>
        <p className="text-sm">{body}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
        <div className="flex items-center gap-2">
          <Kbd>{keys}</Kbd>
          <span className="text-xs text-muted-foreground">{keyLabel}</span>
          <Button
            size="sm"
            variant="secondary"
            tabIndex={-1}
            className="ml-auto text-xs"
            // Keep focus on the field, so typing carries on.
            onMouseDown={(e) => e.preventDefault()}
            onClick={onDismiss}
          >
            Got it
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

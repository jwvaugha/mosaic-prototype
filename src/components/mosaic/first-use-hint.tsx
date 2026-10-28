import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

// First-use hint (Flows 1.1): shown on the first focused field of a user's
// first Workup, beside the field's input, without taking focus. It goes away
// with "Got it" or once any field is marked.

export function FirstUseHint({
  open,
  title,
  body,
  note,
  keys,
  onDismiss,
  anchor,
}: {
  open: boolean
  title: string
  body: string
  note: string
  keys: [string, string][]
  onDismiss: () => void
  // The focused field's input; the card sits to its right, or below it when
  // there's no room.
  anchor: HTMLElement | null
}) {
  return (
    <Popover open={open && !!anchor}>
      <PopoverAnchor virtualRef={{ current: anchor! }} />
      <PopoverContent
        side="right"
        align="start"
        sideOffset={16}
        className="z-50 flex w-[320px] flex-col gap-2.5 border-primary px-4 py-3.5"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <span className="text-base font-semibold">{title}</span>
        <p className="text-sm">{body}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {keys.map(([k, label]) => (
            <span key={k} className="flex items-center gap-1 text-xs text-muted-foreground">
              <Kbd>{k}</Kbd>
              {label}
            </span>
          ))}
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

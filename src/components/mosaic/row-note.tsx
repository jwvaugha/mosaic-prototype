import { NotebookPen, NotebookText } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// A field's note (requirements: Rows, "the note button doubles as a status
// indicator"):
//   - no note: nothing here; "Add note" sits with the row's other actions
//   - a note: this icon stays visible on the row; hovering previews the note,
//     clicking edits it
// The editor opens beside the row from either place, or with N. ⌘↵ saves, Esc
// cancels. Notes never leave the device (requirements: Notes privacy).

export function RowNote({
  name,
  note,
  open,
  onOpen,
  onClose,
  onSave,
}: {
  name: string
  note?: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  onSave: (note: string) => void
}) {
  const [draft, setDraft] = useState(note ?? "")
  useEffect(() => {
    if (open) setDraft(note ?? "")
  }, [open, note])

  return (
    <Popover open={open} onOpenChange={(o) => (o ? onOpen() : onClose())}>
      <PopoverAnchor asChild>
        {note ? (
          <span className="shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  tabIndex={-1}
                  aria-label={`Note: ${note}`}
                  className="text-primary"
                  onClick={onOpen}
                >
                  <NotebookText />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-pre-wrap">
                {note}
                <span className="mt-1 block opacity-70">Click or press N to edit</span>
              </TooltipContent>
            </Tooltip>
          </span>
        ) : (
          <span className="w-0 shrink-0 self-stretch" aria-hidden />
        )}
      </PopoverAnchor>
      <PopoverContent
        align="end"
        className="flex w-80 flex-col gap-2.5"
        // Typing here must not reach the data-entry shortcuts.
        onKeyDown={(e) => e.stopPropagation()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <NotebookPen className="size-4" />
          {note ? "Edit note" : "Add a note"} · {name}
        </span>
        <Textarea
          autoFocus
          rows={4}
          value={draft}
          placeholder="e.g. Measured on the right side; left is damaged."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              onSave(draft)
            }
          }}
        />
        <p className="text-xs text-muted-foreground">Notes stay on this device. They aren't sent with the Analysis.</p>
        <div className="flex items-center gap-2">
          {note && (
            <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => onSave("")}>
              Delete note
            </Button>
          )}
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Kbd>Esc</Kbd>
          </span>
          <Button size="sm" variant="outline" className="text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={() => onSave(draft)}>
            Save <Kbd className="bg-primary-foreground/20 text-primary-foreground">⌘↵</Kbd>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

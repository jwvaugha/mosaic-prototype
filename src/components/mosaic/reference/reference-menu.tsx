import { BookImage, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// The header's "Reference panel" menu: the global auto-show settings that
// replaced the per-section guidance toggles (requirements, 2026-10-14).

export function ReferenceMenu({
  autoShow,
  onChange,
}: {
  autoShow: { metric: boolean; morph: boolean }
  onChange: (next: { metric: boolean; morph: boolean }) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" tabIndex={-1} className="text-xs">
          <BookImage /> Reference panel <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-72 flex-col gap-3">
        <span className="text-sm font-medium">Automatically show the reference panel for</span>
        {(
          [
            ["metric", "Metric fields"],
            ["morph", "Morphological fields"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <Checkbox checked={autoShow[k]} onCheckedChange={(c) => onChange({ ...autoShow, [k]: c === true })} />
            {label}
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          You can always open it for one field with <span className="font-medium">?</span> or the row's reference
          button.
        </p>
      </PopoverContent>
    </Popover>
  )
}

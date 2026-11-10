import { BookImage, Check, ChevronDown, PanelRight, Rows3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import type { RefLayout } from "@/config/test-config"

// Show / Hide reference, with a menu to choose where the panel sits
// (feedback 2026-11-09): beside the fields (A, the default) or under the
// field you're on (C). The bottom dock (B) stays in Test mode only. Picking
// a place also opens the panel.
const PLACES: { id: RefLayout; label: string; hint: string; icon: typeof PanelRight }[] = [
  { id: "A", label: "Beside the fields", hint: "A column on the right that never moves", icon: PanelRight },
  { id: "C", label: "Under the field", hint: "Larger drawings, right below the field you're on", icon: Rows3 },
]

export function ReferenceButton({
  open,
  layout,
  onToggle,
  onLayout,
}: {
  open: boolean
  layout: RefLayout
  onToggle: () => void
  onLayout: (l: RefLayout) => void
}) {
  return (
    <ButtonGroup>
      <Button
        variant={open ? "outline" : "default"}
        size="sm"
        tabIndex={-1}
        className="text-xs"
        aria-pressed={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggle}
      >
        <BookImage />
        {open ? "Hide reference" : "Show reference"}
        <Kbd className={open ? "" : "bg-primary-foreground/20 text-primary-foreground"}>R</Kbd>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={open ? "outline" : "default"}
            size="icon-sm"
            tabIndex={-1}
            aria-label="Where the reference appears"
            onMouseDown={(e) => e.preventDefault()}
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuLabel>Show the reference</DropdownMenuLabel>
          {PLACES.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => onLayout(p.id)}
              aria-checked={layout === p.id}
              role="menuitemradio"
              className="items-start"
            >
              <p.icon className="mt-0.5" />
              <span className="flex flex-1 flex-col gap-0.5">
                <span>{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.hint}</span>
              </span>
              <Check className={layout === p.id ? "mt-0.5 text-foreground" : "invisible"} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

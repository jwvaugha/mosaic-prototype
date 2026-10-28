import { BookImage, ChevronDown, Download, Flag, HardDrive, Pencil } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

// Library: App Header, State=Workup. Everything but Analyze and the
// reference-panel menu is display-only.

export function AppHeader({
  flagBadge,
  referenceMenu,
  onAnalyze,
}: {
  flagBadge?: number
  referenceMenu?: ReactNode
  onAnalyze: () => void
}) {
  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-5 border-b bg-background px-6">
      <span className="text-lg leading-none font-semibold tracking-wide text-primary">MOSAIC</span>
      <span className="h-5 w-px bg-border" />
      <span className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Case</span>
        <span className="text-sm font-medium">MSUFAL016-26</span>
        <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label="Rename">
          <Pencil />
        </Button>
      </span>
      <nav className="flex gap-4 text-sm text-muted-foreground">
        <span>Workups</span>
        <span>Help</span>
        <span>About</span>
      </nav>
      <span className="flex-1" />
      {referenceMenu ?? (
        <Button variant="ghost" size="sm" tabIndex={-1} className="text-xs">
          <BookImage /> Reference panel <ChevronDown />
        </Button>
      )}
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <HardDrive className="size-3.5" /> Saved on this device · 10:42
      </span>
      <Button variant="outline" size="sm" tabIndex={-1} className="text-xs">
        <Download /> Download progress
      </Button>
      <Button size="sm" tabIndex={-1} className="relative text-xs" onClick={onAnalyze}>
        Analyze
        {!!flagBadge && (
          <span className="absolute -top-2 -right-2 flex items-center gap-0.5 rounded-full border border-primary bg-background px-1.5 text-xs text-primary">
            <Flag className="size-3" />
            {flagBadge}
          </span>
        )}
      </Button>
    </header>
  )
}

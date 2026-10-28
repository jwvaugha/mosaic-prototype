import { BookImage, ChevronDown, Download, Flag, HardDrive, Menu, Pencil } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Library: App Header, State=Workup. Everything but Analyze, Help and the
// reference-panel menu is display-only.
//
// It stays on one line at every width down to 768 px:
//   < 1280  "Saved on this device" and "Reference panel" become icons
//   < 1024  "Download progress" becomes an icon; Workups / Help / About fold
//           into a menu

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
    <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 whitespace-nowrap lg:gap-5 lg:px-6">
      <span className="text-lg leading-none font-semibold tracking-wide text-primary">MOSAIC</span>
      <span className="h-5 w-px shrink-0 bg-border" />
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Case</span>
        <span className="truncate text-sm font-medium">MSUFAL016-26</span>
        <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label="Rename">
          <Pencil />
        </Button>
      </span>
      <nav className="hidden gap-4 text-sm text-muted-foreground lg:flex">
        <span>Workups</span>
        <a href="#/guide" tabIndex={-1} className="hover:text-foreground hover:underline">
          Help
        </a>
        <span>About</span>
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label="Menu" className="lg:hidden">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem disabled>Workups</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => (window.location.hash = "#/guide")}>Help</DropdownMenuItem>
          <DropdownMenuItem disabled>About</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="flex-1" />
      {referenceMenu ?? (
        <Button variant="ghost" size="sm" tabIndex={-1} className="text-xs">
          <BookImage /> Reference panel <ChevronDown />
        </Button>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HardDrive className="size-3.5" />
            <span className="hidden xl:inline">Saved on this device · 10:42</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="xl:hidden">Saved on this device · 10:42</TooltipContent>
      </Tooltip>
      <Button variant="outline" size="sm" tabIndex={-1} className="text-xs" aria-label="Download progress">
        <Download />
        <span className="hidden lg:inline">Download progress</span>
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

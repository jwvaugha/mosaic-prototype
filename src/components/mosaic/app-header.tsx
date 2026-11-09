import { ChevronDown, CircleUserRound, Download, Flag, HardDrive, Lightbulb, NotebookText, Pencil } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// The page frame, top to bottom (Jackson, 2026-10-28):
//   AppHeader     navigation only: MOSAIC · Dashboard | Help · About · profile
//   …rail and main pane…
//   WorkupFooter  only what concerns the dataset as a whole: the Workup's
//                 case number, save status, Download progress, Analyze
//   SubFooter     a very short strip for prototype controls (Test mode)
// Everything but Help, Analyze and Test mode is display-only.

// Help: brings the intro card back (testers closed it and couldn't find it
// again; feedback 2026-11-09) and links to the tester guide.
export function AppHeader({ onShowIntro }: { onShowIntro?: () => void }) {
  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 whitespace-nowrap lg:gap-5 lg:px-6">
      <span className="text-lg leading-none font-semibold tracking-wide text-primary">MOSAIC</span>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="h-5 w-px bg-border" />
        <span>Dashboard</span>
        <span className="h-5 w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger
            tabIndex={-1}
            className="flex items-center gap-1 rounded-sm outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Help <ChevronDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
            {onShowIntro && (
              <DropdownMenuItem onSelect={onShowIntro}>
                <Lightbulb /> How scoring works
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <a href="#/guide">
                <NotebookText /> Tester guide
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>About</span>
      </nav>
      <span className="flex-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" tabIndex={-1} aria-label="Profile" className="rounded-full">
            <CircleUserRound className="size-6 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Profile (display-only)</TooltipContent>
      </Tooltip>
    </header>
  )
}

export function WorkupFooter({ flagBadge, onAnalyze }: { flagBadge?: number; onAnalyze: () => void }) {
  return (
    <footer className="z-20 flex h-14 shrink-0 items-center gap-3 border-t bg-background px-4 whitespace-nowrap lg:gap-5 lg:px-6">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Case</span>
        <span className="truncate text-sm font-medium">MSUFAL016-26</span>
        <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label="Rename">
          <Pencil />
        </Button>
      </span>
      <span className="flex-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HardDrive className="size-3.5" />
            <span className="hidden md:inline">Saved on this device · 10:42</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="md:hidden">Saved on this device · 10:42</TooltipContent>
      </Tooltip>
      <Button variant="outline" size="sm" tabIndex={-1} className="text-xs" aria-label="Download progress">
        <Download />
        <span className="hidden md:inline">Download progress</span>
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
    </footer>
  )
}

export function SubFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-7 shrink-0 items-center gap-3 border-t border-dashed border-primary/40 bg-muted/60 px-3 text-xs text-muted-foreground">
      {children}
    </div>
  )
}

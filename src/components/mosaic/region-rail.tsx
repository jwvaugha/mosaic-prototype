import { Flag, TriangleAlert } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Progress } from "./progress-bar"

// Regions → modality sections, with per-section counts (Region Rail in the
// Mosaic-shadcn library). Only the prototype's sections are listed.

export type RailSection = {
  id: string
  region: string
  label: string
  recorded: number
  total: number
  flagged: number
  warnings: number
}

export function RegionRail({
  sections,
  current,
  showFlags,
  totals,
  onSelect,
}: {
  sections: RailSection[]
  current: string
  showFlags: boolean
  totals: { recorded: number; total: number; skipped: number }
  onSelect: (id: string) => void
}) {
  const regions = [...new Set(sections.map((s) => s.region))]
  return (
    <Sidebar className="top-14 h-[calc(100svh-3.5rem)]" collapsible="none">
      <SidebarHeader className="gap-2 px-4 pt-5">
        <span className="text-sm text-muted-foreground">Regions</span>
        <span className="text-xs text-muted-foreground">
          {totals.recorded} of {totals.total} recorded
          {totals.skipped > 0 && ` · ${totals.skipped} skipped`}
        </span>
        <Progress value={totals.total ? totals.recorded / totals.total : 0} />
      </SidebarHeader>
      <SidebarContent>
        {regions.map((region) => (
          <SidebarGroup key={region} className="py-1">
            <SidebarGroupLabel className="text-[15px] font-medium text-sidebar-foreground">
              {region}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  {sections
                    .filter((s) => s.region === region)
                    .map((s) => (
                      <SidebarMenuSubItem key={s.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={s.id === current}
                          className="data-[active=true]:font-medium"
                        >
                          <button type="button" tabIndex={-1} onClick={() => onSelect(s.id)}>
                            <span className="flex-1 text-left">{s.label}</span>
                            {s.warnings > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-warning">
                                <TriangleAlert className="size-3.5" />
                                {s.warnings}
                              </span>
                            )}
                            {showFlags && s.flagged > 0 && <RailFlagCount count={s.flagged} />}
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {s.recorded} / {s.total}
                            </span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

// WF / Rail flag count in the wireframes.
export function RailFlagCount({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} to come back to`}
      className="flex items-center gap-0.5 rounded-full border border-primary px-1.5 text-xs text-primary"
    >
      <Flag className="size-3" />
      {count}
    </span>
  )
}

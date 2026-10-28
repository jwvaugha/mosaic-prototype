import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleX,
  Ellipsis,
  EyeOff,
  Flag,
  GripVertical,
  ListOrdered,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  TriangleAlert,
} from "lucide-react"
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Progress } from "./progress-bar"

// Library: Region Rail (Mosaic-shadcn page "Region Rail"). Rail Header in
// Default or Edit order mode, then one Rail Region per Region in rail order:
//
//   Expanded / Collapsed   chevron toggles; a collapsed Region rolls up its
//                          error, warning and flag counts
//   Hover / Focus          accent fill / ring, plus the Region menu (⋯)
//   Not in Workup          muted, "+ add"
//   Set aside              EyeOff, "N kept · + add back", never expands
//   Editing / Dragging     Edit order mode: grip, drag or ⌥↑/⌥↓ to move
//
// Keyboard (requirements, "Keyboard-reachable rail"): F6 moves focus to the
// rail and Esc returns it. The Regions follow the ARIA tree pattern: ↑/↓ move,
// →/← expand, collapse or step in and out, Enter opens or adds, ⇧F10 opens the
// Region menu.

export type RailModality = {
  label: string
  recorded: number
  total: number
  flagged?: number
  warnings?: number
  current?: boolean
  // Display-only sections have no onSelect.
  onSelect?: () => void
}

export type RailRegion = {
  name: string
  membership: "in" | "out" | "set-aside"
  // Observations a Set-aside Region keeps.
  kept: number
  expanded: boolean
  // False when removing it would leave nothing to enter.
  removable: boolean
  errors?: number
  warnings?: number
  modalities: RailModality[]
}

export type RegionRailProps = {
  regions: RailRegion[]
  totals: { recorded: number; total: number; skipped: number }
  showFlags: boolean
  mode: "default" | "edit"
  savedDefault: boolean
  onToggle: (region: string, open?: boolean) => void
  onAdd: (region: string) => void
  onRemove: (region: string, kept: number) => void
  onMove: (region: string, to: number) => void
  onModeChange: (mode: "default" | "edit") => void
  onSaveDefault: () => void
  onResetOrder: () => void
  // A display-only section was chosen.
  onUnavailable: (title: string) => void
  // Collapsed to a strip of Region codes; `overlay` (narrow screens) floats
  // the expanded rail over the content instead of pushing it aside.
  collapsed: boolean
  overlay: boolean
  onCollapse: (collapsed: boolean) => void
}

const sum = (xs: (number | undefined)[]) => xs.reduce<number>((a, x) => a + (x ?? 0), 0)

export function RegionRail(props: RegionRailProps) {
  if (props.collapsed) return <CollapsedRail {...props} />
  const rail = <ExpandedRail {...props} />
  if (!props.overlay) return rail
  // Narrow screens: a 56 px strip keeps its place, and the full rail floats
  // over the content with a scrim; choosing a section or the scrim closes it.
  return (
    <div className="relative w-14 shrink-0">
      <div className="fixed inset-0 top-14 z-30 bg-black/30" aria-hidden onClick={() => props.onCollapse(true)} />
      <div className="absolute inset-y-0 left-0 z-40 w-[280px] shadow-xl">{rail}</div>
    </div>
  )
}

// Two-letter codes for the collapsed rail.
const REGION_CODES: Record<string, string> = {
  Cranium: "Cr",
  Mandible: "Ma",
  Dentition: "De",
  Vertebrae: "Ve",
  Thorax: "Th",
  "Shoulder & upper limb": "SU",
  Pelvis: "Pe",
  "Lower limb": "LL",
  "Whole skeleton": "WS",
}

function CollapsedRail({ regions, totals, onCollapse }: RegionRailProps) {
  return (
    <Sidebar className="top-14 h-[calc(100svh-3.5rem)] w-14 shrink-0 border-r" collapsible="none" aria-label="Regions">
      <div className="flex flex-col items-center gap-1 overflow-y-auto py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Expand Regions" onClick={() => onCollapse(false)}>
              <PanelLeftOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand Regions</TooltipContent>
        </Tooltip>
        <Progress
          className="my-2 h-1.5 w-8 bg-primary/20"
          value={totals.total ? totals.recorded / totals.total : 0}
        />
        {regions.map((r) => {
          const current = r.modalities.some((m) => m.current)
          const first = r.modalities.find((m) => m.onSelect)
          const recorded = sum(r.modalities.map((m) => m.recorded))
          const total = sum(r.modalities.map((m) => m.total))
          const inWorkup = r.membership === "in"
          return (
            <Tooltip key={r.name}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${r.name}, ${recorded} of ${total}`}
                  aria-current={current || undefined}
                  disabled={!inWorkup || !first}
                  onClick={() => first?.onSelect?.()}
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-lg text-xs font-semibold text-sidebar-foreground hover:bg-sidebar-accent disabled:text-muted-foreground disabled:hover:bg-transparent",
                    current && "bg-sidebar-accent",
                  )}
                >
                  {current && <span className="absolute top-3 left-0 h-4 w-[3px] rounded-sm bg-sidebar-primary" />}
                  {REGION_CODES[r.name] ?? r.name.slice(0, 2)}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {r.name} · {inWorkup ? `${recorded} / ${total}` : r.membership === "set-aside" ? "set aside" : "not in this Workup"}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </Sidebar>
  )
}

function ExpandedRail(props: RegionRailProps) {
  const { totals, mode } = props
  const [announcement, setAnnouncement] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  // F6 jumps into the rail from anywhere; Esc in the rail goes back.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "F6" || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const root = rootRef.current
      if (!root || root.contains(document.activeElement)) return
      e.preventDefault()
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      root.querySelector<HTMLElement>("[data-rail-item][tabindex='0']")?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const onRootKeyDown = (e: KeyboardEvent) => {
    // Menus and dialogs are portalled; their keys still bubble here in React.
    if (e.key !== "Escape" || e.defaultPrevented || !rootRef.current?.contains(e.target as Node)) return
    const back = returnTo.current
    if (back?.isConnected) {
      e.preventDefault()
      back.focus()
      returnTo.current = null
    }
  }

  return (
    <Sidebar className="top-14 h-[calc(100svh-3.5rem)] border-r" collapsible="none">
      <div ref={rootRef} className="flex flex-col gap-4 overflow-y-auto p-4" onKeyDown={onRootKeyDown}>
        {mode === "edit" ? (
          <>
            <EditOrderHeader {...props} />
            <EditOrderList {...props} announce={setAnnouncement} />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex h-8 items-center">
                <span className="text-xs font-medium text-muted-foreground">Regions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={() => props.onModeChange("edit")}
                >
                  <ListOrdered /> Edit order
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Collapse Regions" onClick={() => props.onCollapse(true)}>
                      <PanelLeftClose />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Collapse Regions</TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs text-muted-foreground">
                {totals.recorded} of {totals.total} recorded
                {totals.skipped > 0 && ` · ${totals.skipped} skipped`}
              </span>
              <Progress className="h-2 bg-primary/20" value={totals.total ? totals.recorded / totals.total : 0} />
            </div>
            <RegionTree {...props} />
          </>
        )}
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </div>
    </Sidebar>
  )
}

// ---------------------------------------------------------------------------
// Default mode: the Region tree

type TreeItem = { key: string; region: RailRegion; modality?: RailModality }

function visibleItems(regions: RailRegion[]): TreeItem[] {
  return regions.flatMap((r) => {
    const own: TreeItem = { key: r.name, region: r }
    if (r.membership !== "in" || !r.expanded) return [own]
    return [own, ...r.modalities.map((m) => ({ key: `${r.name}/${m.label}`, region: r, modality: m }))]
  })
}

function RegionTree(props: RegionRailProps) {
  const { regions, onToggle, onAdd } = props
  const items = visibleItems(regions)
  const current = items.find((i) => i.modality?.current)
  const [active, setActive] = useState<string | null>(null)
  // The Tab stop: the last item used, else the current section, else the top.
  const tabStop = items.some((i) => i.key === active) ? (active ?? undefined) : (current ?? items[0])?.key
  const [menuFor, setMenuFor] = useState<string | null>(null)
  // The Region stays set while the dialog animates out.
  const [confirm, setConfirm] = useState<{ region: RailRegion; open: boolean } | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const focusKey = (key: string) => {
    setActive(key)
    listRef.current?.querySelector<HTMLElement>(`[data-rail-item="${CSS.escape(key)}"]`)?.focus()
  }

  const activate = (item: TreeItem) => {
    const r = item.region
    if (item.modality) {
      const m = item.modality
      if (m.onSelect) m.onSelect()
      else props.onUnavailable(`${r.name} · ${m.label}`)
      return
    }
    if (r.membership === "out" || r.membership === "set-aside") onAdd(r.name)
    else onToggle(r.name)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>("[data-rail-item]")?.dataset.railItem
    const i = items.findIndex((x) => x.key === key)
    if (i === -1 || e.altKey || e.ctrlKey || e.metaKey) return
    const item = items[i]
    const r = item.region
    const expandable = !item.modality && r.membership === "in"
    const go = (j: number) => {
      e.preventDefault()
      const to = items[Math.max(0, Math.min(items.length - 1, j))]
      if (to) focusKey(to.key)
    }
    switch (e.key) {
      case "ArrowDown":
        return go(i + 1)
      case "ArrowUp":
        return go(i - 1)
      case "Home":
        return go(0)
      case "End":
        return go(items.length - 1)
      case "ArrowRight":
        e.preventDefault()
        if (expandable && !r.expanded) onToggle(r.name, true)
        else if (expandable) go(i + 1)
        return
      case "ArrowLeft":
        e.preventDefault()
        if (item.modality) go(items.findIndex((x) => x.key === r.name))
        else if (expandable && r.expanded) onToggle(r.name, false)
        return
      case "Enter":
      case " ":
        e.preventDefault()
        return activate(item)
      case "F10":
      case "ContextMenu":
        if (e.key === "F10" && !e.shiftKey) return
        if (item.modality || r.membership !== "in") return
        e.preventDefault()
        return setMenuFor(r.name)
    }
  }

  const byRegion = new Map<string, TreeItem[]>()
  for (const it of items) if (it.modality) byRegion.set(it.region.name, [...(byRegion.get(it.region.name) ?? []), it])

  return (
    <>
      <ul ref={listRef} role="tree" aria-label="Regions" className="flex flex-col gap-1" onKeyDown={onKeyDown}>
        {regions.map((r) => (
          <RegionItem
            key={r.name}
            region={r}
            showFlags={props.showFlags}
            tabStop={tabStop}
            menuOpen={menuFor === r.name}
            onMenuOpenChange={(o) => setMenuFor(o ? r.name : null)}
            onFocusItem={setActive}
            onActivate={activate}
            onAskRemove={() => setConfirm({ region: r, open: true })}
            items={byRegion.get(r.name) ?? []}
          />
        ))}
      </ul>
      <RemoveRegionDialog
        region={confirm?.region ?? null}
        open={!!confirm?.open}
        onCancel={() => setConfirm((c) => c && { ...c, open: false })}
        onConfirm={(r, kept) => {
          setConfirm((c) => c && { ...c, open: false })
          props.onRemove(r.name, kept)
          // Focus stays on the Region, now showing "add" or "add back".
          requestAnimationFrame(() => focusKey(r.name))
        }}
      />
    </>
  )
}

const recordedIn = (r: RailRegion) => sum(r.modalities.map((m) => m.recorded))
const totalIn = (r: RailRegion) => sum(r.modalities.map((m) => m.total))

// Focus ring for rail rows: the Figma Focus state is a 2px sidebar-ring stroke.
const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-inset"

function RegionItem({
  region: r,
  showFlags,
  tabStop,
  menuOpen,
  onMenuOpenChange,
  onFocusItem,
  onActivate,
  onAskRemove,
  items,
}: {
  region: RailRegion
  showFlags: boolean
  tabStop: string | undefined
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  onFocusItem: (key: string) => void
  onActivate: (item: TreeItem) => void
  onAskRemove: () => void
  items: TreeItem[]
}) {
  const inWorkup = r.membership === "in"
  const itemProps = {
    "data-rail-item": r.name,
    tabIndex: tabStop === r.name ? 0 : -1,
    onFocus: (e: FocusEvent) => e.target === e.currentTarget && onFocusItem(r.name),
  }

  if (!inWorkup) {
    const setAside = r.membership === "set-aside"
    return (
      <li
        role="treeitem"
        aria-level={1}
        aria-label={setAside ? `${r.name}, set aside, ${r.kept} kept` : `${r.name}, not in this Workup`}
        className={cn(
          "flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground",
          FOCUS_RING,
        )}
        {...itemProps}
      >
        {setAside ? <EyeOff className="size-4 shrink-0" /> : <span className="size-4 shrink-0" />}
        <span className="min-w-0 flex-1 truncate">{r.name}</span>
        {setAside && <span className="shrink-0 text-xs">{r.kept} kept</span>}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onActivate({ key: r.name, region: r })}
          className="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="size-3.5" /> {setAside ? "add back" : "add"}
        </button>
      </li>
    )
  }

  const Chevron = r.expanded ? ChevronDown : ChevronRight
  const flagged = showFlags ? sum(r.modalities.map((m) => m.flagged)) : 0
  const warnings = (r.warnings ?? 0) + sum(r.modalities.map((m) => m.warnings))

  return (
    <li
      role="treeitem"
      aria-level={1}
      aria-expanded={r.expanded}
      aria-label={`${r.name}, ${recordedIn(r)} of ${totalIn(r)} recorded`}
      className="group/region flex flex-col gap-1 rounded-lg outline-none"
      {...itemProps}
    >
      <div
        className={cn(
          "group/header flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 hover:bg-sidebar-accent",
          "group-focus-visible/region:ring-2 group-focus-visible/region:ring-sidebar-ring group-focus-visible/region:ring-inset",
          menuOpen && "bg-sidebar-accent",
        )}
        onClick={() => onActivate({ key: r.name, region: r })}
      >
        <Chevron className="size-4 shrink-0" />
        <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
        {!r.expanded && <IssueCounts errors={r.errors} warnings={warnings} flagged={flagged} />}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {recordedIn(r)} / {totalIn(r)}
        </span>
        <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`${r.name} menu`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "-mr-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground",
                "hidden group-hover/header:flex group-focus-visible/region:flex",
                menuOpen && "flex",
              )}
            >
              <Ellipsis className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="right"
            className="w-56"
            // React events bubble through the portal; keep them off the header.
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              disabled={!r.removable}
              onSelect={onAskRemove}
              variant="destructive"
            >
              Remove from Workup…
            </DropdownMenuItem>
            {!r.removable && (
              <DropdownMenuLabel>The prototype needs one Region you can enter.</DropdownMenuLabel>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {r.expanded && (
        <ul role="group" className="flex flex-col gap-1 pl-6">
          {items.map((it) => (
            <ModalityItem
              key={it.key}
              item={it}
              showFlags={showFlags}
              tabIndex={tabStop === it.key ? 0 : -1}
              onFocusItem={onFocusItem}
              onActivate={onActivate}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function ModalityItem({
  item,
  showFlags,
  tabIndex,
  onFocusItem,
  onActivate,
}: {
  item: TreeItem
  showFlags: boolean
  tabIndex: number
  onFocusItem: (key: string) => void
  onActivate: (item: TreeItem) => void
}) {
  const m = item.modality!
  return (
    <li
      role="treeitem"
      aria-level={2}
      aria-current={m.current ? "page" : undefined}
      aria-selected={!!m.current}
      aria-label={`${m.label}, ${m.recorded} of ${m.total} recorded`}
      data-rail-item={item.key}
      tabIndex={tabIndex}
      onFocus={() => onFocusItem(item.key)}
      onClick={(e) => {
        e.stopPropagation()
        onActivate(item)
      }}
      className={cn(
        "relative flex h-7 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-sidebar-accent",
        FOCUS_RING,
        m.current && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
      )}
    >
      {m.current && <span className="absolute top-1.5 left-0 h-4 w-[3px] rounded-sm bg-sidebar-primary" />}
      <span className="flex-1 truncate">{m.label}</span>
      <IssueCounts warnings={m.warnings} flagged={showFlags ? m.flagged : 0} />
      <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
        {m.recorded} / {m.total}
      </span>
    </li>
  )
}

function RemoveRegionDialog({
  region: r,
  open,
  onCancel,
  onConfirm,
}: {
  region: RailRegion | null
  open: boolean
  onCancel: () => void
  onConfirm: (r: RailRegion, kept: number) => void
}) {
  const kept = r ? recordedIn(r) : 0
  const obs = `${kept} Observation${kept === 1 ? "" : "s"}`
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="sm:max-w-[512px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {r?.name} from this Workup?</AlertDialogTitle>
          <AlertDialogDescription>
            {kept > 0
              ? `${r?.name} has ${obs}. They will be kept but set aside: excluded from any Analysis, and restored if you add the Region back. Nothing is deleted.`
              : `${r?.name} has no Observations yet. It goes back to the Regions you can add.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => r && onConfirm(r, kept)}>
            {kept > 0 ? "Set aside Region" : "Remove Region"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Edit order mode

function EditOrderHeader({ savedDefault, onModeChange, onSaveDefault, onResetOrder }: RegionRailProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-8 items-center">
        <span className="text-xs font-medium text-muted-foreground">Edit order</span>
        <Button size="sm" className="ml-auto" onClick={() => onModeChange("default")}>
          Done
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">Drag to reorder. Applies to this Workup only.</span>
      {savedDefault ? (
        <span role="status" className="flex items-center gap-1.5 py-2 text-xs font-medium text-success-muted-foreground">
          <CircleCheck className="size-3.5" /> Saved as your default order
        </span>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={onSaveDefault}>
          <Bookmark /> Save as my default order
        </Button>
      )}
      <Button variant="link" size="sm" className="self-start" onClick={onResetOrder}>
        <RotateCcw /> Reset to anatomical
      </Button>
    </div>
  )
}

function EditOrderList({ regions, onMove, announce }: RegionRailProps & { announce: (s: string) => void }) {
  const [dragging, setDragging] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(regions[0]?.name)

  const moveTo = (name: string, to: number) => {
    const clamped = Math.max(0, Math.min(regions.length - 1, to))
    onMove(name, clamped)
    announce(`${name} moved to position ${clamped + 1} of ${regions.length}`)
  }

  const onKeyDown = (e: KeyboardEvent, name: string, i: number) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const dir = e.key === "ArrowDown" ? 1 : -1
    if (e.altKey) {
      // ⌥↑/⌥↓ carries the Region; focus stays on it.
      moveTo(name, i + dir)
      return
    }
    const to = regions[i + dir]
    if (!to) return
    setActive(to.name)
    listRef.current?.querySelector<HTMLElement>(`[data-rail-item="${CSS.escape(to.name)}"]`)?.focus()
  }

  return (
    <ul ref={listRef} aria-label="Region order" className="flex flex-col gap-1">
      {regions.map((r, i) => (
        <li
          key={r.name}
          data-rail-item={r.name}
          tabIndex={active === r.name ? 0 : -1}
          aria-roledescription="sortable"
          aria-label={`${r.name}, position ${i + 1} of ${regions.length}. Alt plus arrow keys to move.`}
          draggable
          onFocus={() => setActive(r.name)}
          onKeyDown={(e) => onKeyDown(e, r.name, i)}
          onDragStart={(e) => {
            setDragging(r.name)
            e.dataTransfer.effectAllowed = "move"
            e.dataTransfer.setData("text/plain", r.name)
          }}
          onDragOver={(e) => {
            if (!dragging) return
            e.preventDefault()
            if (dragging === r.name) return
            // Reorder live as the pointer crosses a row's midpoint.
            const box = e.currentTarget.getBoundingClientRect()
            const from = regions.findIndex((x) => x.name === dragging)
            const below = e.clientY > box.top + box.height / 2
            if ((from < i && below) || (from > i && !below)) onMove(dragging, i)
          }}
          onDrop={(e) => e.preventDefault()}
          onDragEnd={() => {
            if (dragging) announce(`${dragging} moved to position ${regions.findIndex((x) => x.name === dragging) + 1}`)
            setDragging(null)
          }}
          className={cn(
            "flex h-8 cursor-grab items-center gap-2 rounded-lg border border-transparent px-2 active:cursor-grabbing",
            FOCUS_RING,
            dragging === r.name && "border-sidebar-border bg-sidebar shadow-sm",
          )}
        >
          <GripVertical className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {r.membership === "in" ? `${recordedIn(r)} / ${totalIn(r)}` : r.membership === "set-aside" ? "Set aside" : "—"}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------

function IssueCounts({ errors, warnings, flagged }: { errors?: number; warnings?: number; flagged?: number }) {
  return (
    <>
      {!!errors && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-destructive">
          <CircleX className="size-3.5" />
          {errors}
        </span>
      )}
      {!!warnings && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-warning-muted-foreground">
          <TriangleAlert className="size-3.5" />
          {warnings}
        </span>
      )}
      {!!flagged && <RailFlagCount count={flagged} />}
    </>
  )
}

// WF / Rail flag count in the wireframes: navy outline pill.
export function RailFlagCount({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} to come back to`}
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-primary px-1.5 text-xs font-medium text-primary"
    >
      <Flag className="size-3" />
      {count}
    </span>
  )
}

import { Check, CircleHelp } from "lucide-react"
import { useState, type KeyboardEvent, type ReactNode, type Ref } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

// Library: Bone Group Header. Title row (bone, counts, Side, Skip bone) and a
// Condition row of chips. Both rows are Tab stops before the bone's fields:
//   header      ←/→ switch Side; − Skips the bone (keyboard controller)
//   conditions  ←/→ move between chips; Space ticks one
// Side and Condition are display-only in the prototype: they change on
// screen but aren't stored.

const CONDITIONS = ["Autopsy cut", "Postmortem damage", "Pathology"]

export function BoneGroupHeader({
  id,
  name,
  counts,
  bilateral,
  sideLabel = "Side",
  actions,
  focused,
  conditionsFocused,
  headerRef,
  conditionsRef,
  onFocusHeader,
  onFocusConditions,
}: {
  id?: string
  name: string
  counts: { total: number; recorded: number; skipped: number; flagged: number }
  bilateral: boolean
  sideLabel?: string
  actions?: ReactNode
  focused?: boolean
  conditionsFocused?: boolean
  headerRef?: Ref<HTMLDivElement>
  conditionsRef?: Ref<HTMLDivElement>
  onFocusHeader?: () => void
  onFocusConditions?: () => void
}) {
  const [side, setSide] = useState<"Left" | "Right">("Left")
  const [conditions, setConditions] = useState<string[]>([])
  const parts = [`${counts.recorded} of ${counts.total} recorded`]
  if (counts.skipped) parts.push(`${counts.skipped} skipped`)
  if (counts.flagged) parts.push(`${counts.flagged} to come back to`)

  const onHeaderKey = (e: KeyboardEvent) => {
    if (!bilateral || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      setSide(e.key === "ArrowLeft" ? "Left" : "Right")
    }
  }

  return (
    <div data-bone={id} className="flex w-full flex-col gap-1">
      <div
        ref={headerRef}
        tabIndex={0}
        role="group"
        aria-label={`${name}${bilateral ? `, side ${side}` : ""}`}
        data-focused={focused || undefined}
        onFocus={(e) => e.target === e.currentTarget && onFocusHeader?.()}
        onKeyDown={onHeaderKey}
        className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-1.5 pl-10 outline-none data-focused:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-xs text-muted-foreground">{parts.join(" · ")}</span>
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1">
          {bilateral && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {sideLabel}
                {sideLabel !== "Side" && <CircleHelp className="size-3.5" />}
              </span>
              <div className="flex h-8 items-center rounded-lg bg-muted px-0.5">
                {(["Left", "Right"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    tabIndex={-1}
                    onClick={() => setSide(s)}
                    className={cn(
                      "h-7 rounded-md px-3 text-xs font-medium text-muted-foreground",
                      side === s && "bg-background text-foreground shadow-xs",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {actions}
        </div>
      </div>
      <div
        data-focused={conditionsFocused || undefined}
        className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg px-3 py-1 pl-10 data-focused:bg-muted/50"
      >
        <span className="text-xs text-muted-foreground">Condition</span>
        <ToggleGroup
          ref={conditionsRef}
          type="multiple"
          spacing={2}
          className="flex-wrap"
          aria-label={`${name} condition`}
          value={conditions}
          onValueChange={setConditions}
          onFocus={onFocusConditions}
        >
          {CONDITIONS.map((c) => {
            const on = conditions.includes(c)
            return (
              <ToggleGroupItem
                key={c}
                value={c}
                className="h-7 gap-1.5 rounded-full border bg-background px-3 text-xs font-medium aria-pressed:bg-background data-[state=on]:bg-background"
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-[4px] border border-input",
                    on && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {on && <Check className="size-3" />}
                </span>
                {c}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>
    </div>
  )
}

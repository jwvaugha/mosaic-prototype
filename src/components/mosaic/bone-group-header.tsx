import { CircleHelp } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// Library: Bone Group Header. Title row (bone, counts, Side, Skip bone) and a
// Condition row of chips. Side and Condition are display-only in the
// prototype: they toggle visually but aren't stored, and they stay out of the
// Tab order, which only visits fields.

const CONDITIONS = ["Autopsy cut", "Postmortem damage", "Pathology"]

export function BoneGroupHeader({
  name,
  counts,
  bilateral,
  sideLabel = "Side",
  actions,
}: {
  name: string
  counts: { total: number; recorded: number; skipped: number; flagged: number }
  bilateral: boolean
  sideLabel?: string
  actions?: ReactNode
}) {
  const [side, setSide] = useState<"Left" | "Right">("Left")
  const [conditions, setConditions] = useState<string[]>([])
  const parts = [`${counts.recorded} of ${counts.total} recorded`]
  if (counts.skipped) parts.push(`${counts.skipped} skipped`)
  if (counts.flagged) parts.push(`${counts.flagged} to come back to`)

  return (
    <div className="flex w-[760px] flex-col gap-2 rounded-lg px-3 py-2">
      <div className="flex h-8 items-center gap-3 pl-7">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-xs text-muted-foreground">{parts.join(" · ")}</span>
        <div className="ml-auto flex items-center gap-5">
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
      <div className="flex h-7 items-center gap-2 pl-7">
        <span className="text-xs text-muted-foreground">Condition</span>
        {CONDITIONS.map((c) => {
          const on = conditions.includes(c)
          return (
            <label
              key={c}
              className="flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium"
            >
              <Checkbox
                tabIndex={-1}
                checked={on}
                onCheckedChange={() => setConditions(on ? conditions.filter((x) => x !== c) : [...conditions, c])}
              />
              {c}
            </label>
          )
        })}
      </div>
    </div>
  )
}

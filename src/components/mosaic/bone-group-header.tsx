import type { ReactNode } from "react"

// Bone (or trait group) name with its counts. The Skip-bone control is a
// policy affordance passed in through `actions`. Side and Condition controls
// from the wireframes are left out of the prototype: they don't bear on the
// two questions it tests.

export function BoneGroupHeader({
  name,
  counts,
  actions,
}: {
  name: string
  counts: { total: number; recorded: number; skipped: number; flagged: number }
  actions?: ReactNode
}) {
  const parts = [`${counts.recorded} of ${counts.total} recorded`]
  if (counts.skipped) parts.push(`${counts.skipped} skipped`)
  if (counts.flagged) parts.push(`${counts.flagged} to come back to`)
  return (
    <div className="flex w-[760px] items-baseline gap-3 px-3 pt-6 pb-2 pl-[42px]">
      <h3 className="text-lg font-semibold">{name}</h3>
      <span className="text-xs text-muted-foreground">{parts.join(" · ")}</span>
      <div className="ml-auto">{actions}</div>
    </div>
  )
}

import type { ReactNode } from "react"
import { ComeBackFlag } from "@/components/mosaic/come-back-flag"
import { RowActions, rowActionList } from "@/components/mosaic/row-actions"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import type { FieldState, FieldStatus, FlagReason } from "@/domain/workup"
import type { IncompletionPolicy } from "./incompletion"

// What a policy adds to each row and bone header. Rows render these slots
// without knowing which policy produced them.

export function rowAffordances({
  policy,
  name,
  modality,
  field,
  status,
  focused,
  showKeyHints,
  onToggleSkip,
  onToggleFlag,
  onFlagReason,
  onClear,
}: {
  policy: IncompletionPolicy
  name: string
  modality: "metric" | "morph"
  field: FieldState
  status: FieldStatus
  focused: boolean
  showKeyHints: boolean
  onToggleSkip: () => void
  onToggleFlag: () => void
  onFlagReason: (r: FlagReason | undefined) => void
  onClear: () => void
}): { actions?: ReactNode; gutter?: ReactNode } {
  // Any field can be Skipped (a score is cleared, with Undo) and flagged to
  // come back to; a scored Morph field can be cleared back to blank. Metric
  // values clear by deleting the text.
  const list = rowActionList({
    skipped: status === "skipped",
    flagged: !!field.flag,
    scoredMorph: field.value !== null && modality === "morph",
    onSkip: onToggleSkip,
    onFlag: onToggleFlag,
    onClear,
  }).filter((a) => (a.id === "skip" ? policy.allowSkip : a.id === "flag" ? policy.allowFlag : true))
  const actions = <RowActions actions={list} showKeyHints={showKeyHints} />
  // A flagged field keeps its pill (with the optional reason) beside the row.
  const gutter =
    policy.allowFlag && field.flag ? (
      <ComeBackFlag
        name={name}
        flagged
        reason={field.flag.reason}
        rowFocused={focused}
        showKeyHints={showKeyHints}
        onToggle={onToggleFlag}
        onReason={onFlagReason}
      />
    ) : undefined
  return { actions, gutter }
}

export function boneAffordances(policy: IncompletionPolicy, showKeyHints: boolean, onSkipBone: () => void): ReactNode {
  if (!policy.allowSkip) return undefined
  return (
    <Button
      variant="ghost"
      size="xs"
      tabIndex={-1}
      onClick={onSkipBone}
      className="text-xs font-normal text-muted-foreground hover:text-foreground"
    >
      {showKeyHints && <Kbd>⇧-</Kbd>}
      Skip bone
    </Button>
  )
}

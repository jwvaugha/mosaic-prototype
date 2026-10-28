import type { ReactNode } from "react"
import { ComeBackFlag } from "@/components/mosaic/come-back-flag"
import { KeyHint } from "@/components/mosaic/key-hint"
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
  onToggleFlag,
  onFlagReason,
}: {
  policy: IncompletionPolicy
  name: string
  modality: "metric" | "morph"
  field: FieldState
  status: FieldStatus
  focused: boolean
  showKeyHints: boolean
  onToggleFlag: () => void
  onFlagReason: (r: FlagReason | undefined) => void
}): { actions?: ReactNode; gutter?: ReactNode } {
  // Any field can be Skipped (a score is cleared, with Undo), and a scored
  // Morph field can be cleared back to blank. Metric values clear by deleting
  // the text.
  const scored = field.value !== null
  const actions = showKeyHints ? (
    <>
      {scored && modality === "morph" && <KeyHint keys="⌫" label="Clear" />}
      {policy.allowSkip && <KeyHint keys="-" label={status === "skipped" ? "Un-skip" : "Skip"} />}
    </>
  ) : undefined
  const gutter = policy.allowFlag ? (
    <ComeBackFlag
      name={name}
      flagged={!!field.flag}
      reason={field.flag?.reason}
      rowFocused={focused}
      showKeyHints={showKeyHints}
      onToggle={onToggleFlag}
      onReason={onFlagReason}
    />
  ) : undefined
  return { actions, gutter }
}

export function boneAffordances(policy: IncompletionPolicy, showKeyHints: boolean): ReactNode {
  return policy.allowSkip && showKeyHints ? <KeyHint keys="⇧-" label="Skip bone" /> : undefined
}

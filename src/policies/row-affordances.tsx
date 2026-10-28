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
  field,
  status,
  focused,
  showKeyHints,
  onToggleFlag,
  onFlagReason,
}: {
  policy: IncompletionPolicy
  name: string
  field: FieldState
  status: FieldStatus
  focused: boolean
  showKeyHints: boolean
  onToggleFlag: () => void
  onFlagReason: (r: FlagReason | undefined) => void
}): { actions?: ReactNode; gutter?: ReactNode } {
  const blankOrSkipped = status === "unreached" || status === "skipped"
  const actions =
    policy.allowSkip && blankOrSkipped && showKeyHints ? (
      <KeyHint keys="-" label={status === "skipped" ? "Un-skip" : "Skip"} />
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

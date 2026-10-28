import type { ReactNode } from "react"
import { KeyHint } from "@/components/mosaic/key-hint"
import { Badge } from "@/components/ui/badge"
import type { FieldState, FieldStatus } from "@/domain/workup"
import type { IncompletionPolicy } from "./incompletion"

// What a policy adds to each row and bone header. Rows render these slots
// without knowing which policy produced them.

export function rowAffordances(
  policy: IncompletionPolicy,
  field: FieldState,
  status: FieldStatus,
  showKeyHints: boolean,
): { actions?: ReactNode; gutter?: ReactNode } {
  const actions =
    policy.allowSkip && status !== "recorded" && status !== "warning" && status !== "acknowledged"
      ? showKeyHints && <KeyHint keys="-" label={status === "skipped" ? "Un-skip" : "Skip"} />
      : undefined
  // Placeholder until the come-back flag component lands (issue 07).
  const gutter = policy.allowFlag && field.flag ? <Badge variant="outline">Come back to</Badge> : undefined
  return { actions, gutter }
}

export function boneAffordances(policy: IncompletionPolicy, showKeyHints: boolean): ReactNode {
  return policy.allowSkip && showKeyHints ? <KeyHint keys="⇧-" label="Skip bone" /> : undefined
}

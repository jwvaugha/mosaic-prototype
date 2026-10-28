import type { ReactNode } from "react"
import type { Variable } from "@/data/types"
import type { FieldStatus } from "@/domain/workup"
import { cn } from "@/lib/utils"
import { RowActions, type RowAction } from "./row-actions"
import { RowStatus } from "./row-status"

// The shared shell for Metric and Morphological rows (library: Metric /
// Morphological Variable Row). 760 × 52, padding 8/12, gap 12: status icon,
// label column, control, then trailing actions shown on hover or focus.
//
// Rows know nothing about the active incompletion policy or reference layout:
// the policy passes its affordances in through `actions` (start of the
// trailing group) and `gutter` (outside the row), and the reference presenter
// uses `below`.

export type RowSlots = {
  actions?: RowAction[]
  gutter?: ReactNode
  below?: ReactNode
  // Shown under the row, e.g. an out-of-range message.
  message?: ReactNode
}

export type RowProps = RowSlots & {
  showKeyHints?: boolean
  // Lifted above the intro-dim overlay while the intro card is open.
  spotlight?: boolean
  // Pressing anywhere on the row selects it (not just its input).
  onSelectRow?: () => void
  variable: Variable
  status: FieldStatus
  focused: boolean
  hasReference: boolean
  onOpenReference?: () => void
}

export function VariableRow({
  variable,
  status,
  focused,
  hasReference,
  onOpenReference,
  actions,
  gutter,
  below,
  message,
  labelWidth,
  onSelectRow,
  spotlight,
  showKeyHints = true,
  children,
}: RowProps & {
  labelWidth: number
  children: ReactNode
}) {
  // The code is shown only when it's a real abbreviation (requirements: Rows).
  const showCode = variable.code !== variable.name && !/_/.test(variable.code)
  return (
    <div
      className={cn("group/gutter relative", spotlight && "z-50 rounded-lg bg-background")}
      data-variable={variable.id}
      onMouseDown={(e) => {
        // Ignore events bubbling from portals (popovers, the enlarge dialog).
        const target = e.target as HTMLElement
        if (!onSelectRow || !e.currentTarget.contains(target) || e.button !== 0) return
        // Inputs take focus and place the caret themselves.
        if (target.closest("input, textarea")) return onSelectRow()
        // Elsewhere, stop the browser moving focus to <body> (or, in Safari,
        // not focusing buttons) and select the row's own field instead.
        e.preventDefault()
        onSelectRow()
      }}
    >
      <div
        data-focused={focused || undefined}
        className="group/row flex w-full flex-col gap-1 rounded-lg px-3 py-2 hover:bg-muted/50 data-focused:bg-muted/50"
      >
        {/* On narrow panes the input and then the actions wrap below the name. */}
        <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
          <RowStatus status={status} className="size-4" />
          {/* The name column starts at 160 px and grows to its full width, so
              a narrow pane shrinks it (long names wrap) before the input has to
              move below it. */}
          <div className="leading-5" style={{ flex: "1 1 160px", maxWidth: labelWidth }}>
            <span className={cn("text-sm font-medium", status === "skipped" && "text-muted-foreground")}>
              {variable.name}
            </span>
            {showCode && (
              <span className="ml-2 inline-block font-mono text-xs text-muted-foreground">{variable.code}</span>
            )}
          </div>
          {/* The input and its actions stay together: on a narrow pane they
              move below the name as one line, never apart. */}
          <div className="flex min-w-fit flex-1 items-center gap-3">
            <div className="flex shrink-0 items-center">{children}</div>
            {/* A flagged field's pill stays visible after the input. */}
            {gutter && <div className="shrink-0">{gutter}</div>}
            <div
              className={cn(
                // Fills what's left of the line; RowActions decides whether the
                // actions fit inline or fold into "⋯".
                "flex min-w-9 flex-1 items-center justify-end",
                "opacity-0 group-hover/row:opacity-100 group-data-focused/row:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100",
              )}
            >
              <RowActions actions={actions ?? []} showKeyHints={showKeyHints} onReference={hasReference ? onOpenReference : undefined} />
            </div>
          </div>
        </div>
        {message}
      </div>
      {below}
    </div>
  )
}

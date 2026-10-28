import { FilePlus, Image } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Variable } from "@/data/types"
import type { FieldStatus } from "@/domain/workup"
import { cn } from "@/lib/utils"
import { RowStatus } from "./row-status"

// The shared shell for Metric and Morphological rows. Rows know nothing about
// the active incompletion policy or reference layout: the policy passes its
// affordances in through `actions` (right side, shown on hover or focus) and
// `gutter` (outside the 760 px row), and the reference presenter uses `below`.

export type RowSlots = {
  actions?: ReactNode
  gutter?: ReactNode
  below?: ReactNode
  // Shown under the row, e.g. an out-of-range message.
  message?: ReactNode
}

export type RowProps = RowSlots & {
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
  children,
}: RowProps & { children: ReactNode }) {
  const showCode = variable.code !== variable.name && !/_/.test(variable.code)
  return (
    <div className="relative" data-variable={variable.id}>
      <div
        data-focused={focused || undefined}
        className={cn(
          "group/row flex min-h-14 w-[760px] items-center gap-3 rounded-lg px-3 py-2",
          "hover:bg-muted/50 data-focused:bg-muted/70",
        )}
      >
        <RowStatus status={status} />
        <div className="flex w-[300px] shrink-0 flex-wrap items-baseline gap-x-2">
          <span
            className={cn(
              "text-[15px] leading-5 font-medium",
              status === "skipped" && "text-muted-foreground",
            )}
          >
            {variable.name}
          </span>
          {showCode && <span className="font-mono text-xs text-muted-foreground">{variable.code}</span>}
        </div>
        <div className="flex flex-1 items-center">{children}</div>
        <div
          className={cn(
            "flex items-center gap-1",
            "opacity-0 group-hover/row:opacity-100 group-data-focused/row:opacity-100 focus-within:opacity-100",
          )}
        >
          {actions}
          {hasReference && (
            <RowIconButton label="Reference" shortcut="?" onClick={onOpenReference}>
              <Image />
            </RowIconButton>
          )}
          <RowIconButton label="Add note">
            <FilePlus />
          </RowIconButton>
        </div>
      </div>
      {gutter && <div className="absolute top-2 left-[772px]">{gutter}</div>}
      {message && <div className="w-[760px] pr-3 pb-2 pl-[42px]">{message}</div>}
      {below}
    </div>
  )
}

function RowIconButton({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string
  shortcut?: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label={label} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 opacity-70">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

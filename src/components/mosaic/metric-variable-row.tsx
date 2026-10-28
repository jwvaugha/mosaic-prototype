import { useEffect, useState, type Ref } from "react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { VariableRow, type RowProps } from "./variable-row"

// A number input with unit and precision. The draft is local and commits on
// blur, so a new out-of-range warning appears only on leaving the field
// (requirements: Validation). The keyboard controller handles Enter and `-`.

export function MetricVariableRow({
  value,
  onCommit,
  onFocus,
  onAcknowledge,
  onUnacknowledge,
  inputRef,
  ...row
}: RowProps & {
  value: string | null
  onCommit: (value: string) => void
  onFocus: () => void
  onAcknowledge: () => void
  onUnacknowledge: () => void
  inputRef?: Ref<HTMLElement>
}) {
  const v = row.variable
  const [draft, setDraft] = useState(value ?? "")
  useEffect(() => setDraft(value ?? ""), [value])

  // Warning Line in the library row: indented to the label, Acknowledge /
  // Undo as ghost buttons.
  const outOfRange = `Outside the usual range (${v.range?.min}–${v.range?.max} ${v.unit}).`
  const message =
    row.status === "warning" ? (
      <div className="flex min-h-8 items-center gap-2 pl-7">
        <span className="text-sm text-warning-muted-foreground">{outOfRange}</span>
        <Button size="sm" variant="ghost" tabIndex={-1} onClick={onAcknowledge}>
          Acknowledge
        </Button>
      </div>
    ) : row.status === "acknowledged" ? (
      <div className="flex min-h-8 items-center gap-2 pl-7 text-sm text-muted-foreground">
        <span className="font-medium">Acknowledged ·</span>
        <span>{outOfRange}</span>
        <Button size="sm" variant="ghost" tabIndex={-1} onClick={onUnacknowledge}>
          Undo
        </Button>
      </div>
    ) : (
      row.message
    )

  if (row.status === "skipped") {
    return (
      <VariableRow {...row} message={message} labelWidth={324} reserveActions>
        <div
          ref={inputRef as Ref<HTMLDivElement>}
          tabIndex={0}
          onFocus={onFocus}
          className="rounded-md text-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Skipped
        </div>
      </VariableRow>
    )
  }

  return (
    <VariableRow {...row} message={message} labelWidth={324} reserveActions>
      <InputGroup
        className={cn("h-9 w-[200px] bg-background", row.status === "warning" && "border-warning")}
      >
        <InputGroupInput
          ref={inputRef as Ref<HTMLInputElement>}
          id={`field-${v.id}`}
          aria-label={v.name}
          inputMode="decimal"
          autoComplete="off"
          placeholder="—"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={onFocus}
          onBlur={() => draft !== (value ?? "") && onCommit(draft)}
          className="text-sm"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText className="text-sm">
            {v.unit} · {v.precision}
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </VariableRow>
  )
}

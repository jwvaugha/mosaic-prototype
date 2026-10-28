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
  inputRef,
  ...row
}: RowProps & {
  value: string | null
  onCommit: (value: string) => void
  onFocus: () => void
  onAcknowledge: () => void
  inputRef?: Ref<HTMLInputElement>
}) {
  const v = row.variable
  const [draft, setDraft] = useState(value ?? "")
  useEffect(() => setDraft(value ?? ""), [value])

  const message =
    row.status === "warning" || row.status === "acknowledged" ? (
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm",
          row.status === "warning" ? "bg-warning-muted text-warning-muted-foreground" : "text-muted-foreground",
        )}
      >
        <span className="flex-1">
          {value} {v.unit} is outside the usual range for {v.code} ({v.range!.min}–{v.range!.max} {v.unit}).
          {row.status === "acknowledged" && " Kept as entered."}
        </span>
        {row.status === "warning" && (
          <Button size="xs" variant="outline" tabIndex={-1} onClick={onAcknowledge}>
            Keep value
          </Button>
        )}
      </div>
    ) : (
      row.message
    )

  return (
    <VariableRow {...row} message={message}>
      <InputGroup
        className={cn(
          "w-[200px]",
          row.status === "warning" && "border-warning",
          row.status === "skipped" && "border-dashed",
        )}
      >
        <InputGroupInput
          ref={inputRef}
          id={`field-${v.id}`}
          aria-label={v.name}
          inputMode="decimal"
          autoComplete="off"
          placeholder={row.status === "skipped" ? "Skipped" : "—"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={onFocus}
          onBlur={() => draft !== (value ?? "") && onCommit(draft)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>
            {v.unit} · {v.precision}
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </VariableRow>
  )
}

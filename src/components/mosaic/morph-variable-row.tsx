import type { Ref } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { usePreviewFor } from "@/workup/preview-context"
import { VariableRow, type RowProps } from "./variable-row"

// Segmented Character-state buttons. The group is one Tab stop (Radix roving
// focus); digit keys select a state through the keyboard controller.

export function MorphVariableRow({
  value,
  onSelect,
  onClear,
  onFocus,
  groupRef,
  ...row
}: RowProps & {
  value: string | null
  onSelect: (code: string) => void
  onClear: () => void
  onFocus: () => void
  groupRef?: Ref<HTMLDivElement>
}) {
  const v = row.variable
  if (row.status === "skipped") {
    return (
      <VariableRow {...row} labelWidth={200}>
        <div
          ref={groupRef}
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
    <VariableRow {...row} labelWidth={200}>
      <CharacterStateGroup
        id={v.id}
        label={v.name}
        states={v.states ?? []}
        value={value}
        onSelect={onSelect}
        onClear={onClear}
        onFocus={onFocus}
        groupRef={groupRef}
      />
    </VariableRow>
  )
}

// Hovering a state, or arrowing onto it, previews it wherever this field's
// states appear (the reference panel too); a state previewed from the panel
// is outlined here. Clicking the selected state again clears the score.
export function CharacterStateGroup({
  id,
  label,
  states,
  value,
  onSelect,
  onClear,
  onFocus,
  groupRef,
}: {
  id: string
  label: string
  states: { code: string; label: string }[]
  value: string | null
  onSelect: (code: string) => void
  onClear?: () => void
  onFocus?: () => void
  groupRef?: Ref<HTMLDivElement>
}) {
  const preview = usePreviewFor(id)
  return (
    <ToggleGroup
      ref={groupRef}
      id={`field-${id}`}
      aria-label={label}
      type="single"
      variant="outline"
      spacing={0}
      value={value ?? ""}
      onValueChange={(code) => (code ? onSelect(code) : onClear?.())}
      onFocus={onFocus}
      onMouseLeave={() => preview.clear("hover")}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) preview.clear("focus")
      }}
    >
      {states.map((s) => (
        // Many dictionary states have no label yet; those get no tooltip.
        <Tooltip key={s.code} {...(s.label ? {} : { open: false })}>
          {/* Hover only: on keyboard focus the label would cover the row above. */}
          <TooltipTrigger asChild onFocus={(e) => e.preventDefault()}>
            <ToggleGroupItem
              value={s.code}
              aria-label={s.label ? `${s.code}: ${s.label}` : s.code}
              data-previewed={preview.code === s.code || undefined}
              onMouseEnter={() => preview.show(s.code, "hover")}
              onFocus={() => preview.show(s.code, "focus")}
              className={cn(
                "h-9 min-w-9 bg-background px-2.5 text-sm",
                // The Tooltip trigger overwrites data-state, so style on aria-checked.
                "aria-checked:bg-primary aria-checked:text-primary-foreground aria-checked:hover:bg-primary/90",
                "data-previewed:z-10 data-previewed:ring-2 data-previewed:ring-primary data-previewed:ring-inset",
              )}
            >
              {s.code}
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{s.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  )
}

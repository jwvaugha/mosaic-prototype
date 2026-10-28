import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

// A shortcut chip with an optional action label, e.g. [-] Skip.
// `keys` is split into separate chips: ["⌃", "⌥", "↓"].
export function KeyHint({
  keys,
  label,
  className,
}: {
  keys: string | string[]
  label?: string
  className?: string
}) {
  const list = Array.isArray(keys) ? keys : [keys]
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {list.length === 1 ? (
        <Kbd>{list[0]}</Kbd>
      ) : (
        <KbdGroup>
          {list.map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </KbdGroup>
      )}
      {label}
    </span>
  )
}

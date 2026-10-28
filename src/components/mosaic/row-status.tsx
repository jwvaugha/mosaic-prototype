import { CircleCheck, CircleDashed, CircleMinus, TriangleAlert } from "lucide-react"
import type { FieldStatus } from "@/domain/workup"
import { cn } from "@/lib/utils"

const ICONS: Record<FieldStatus, { icon: typeof CircleCheck; className: string; label: string }> = {
  unreached: { icon: CircleDashed, className: "text-muted-foreground", label: "Blank" },
  recorded: { icon: CircleCheck, className: "text-success", label: "Recorded" },
  warning: { icon: TriangleAlert, className: "text-warning", label: "Out of range" },
  acknowledged: { icon: CircleCheck, className: "text-success", label: "Out of range, acknowledged" },
  skipped: { icon: CircleMinus, className: "text-muted-foreground", label: "Skipped" },
}

export function RowStatus({ status, className }: { status: FieldStatus; className?: string }) {
  const { icon: Icon, className: tone, label } = ICONS[status]
  return <Icon role="img" aria-label={label} className={cn("size-4.5 shrink-0", tone, className)} />
}

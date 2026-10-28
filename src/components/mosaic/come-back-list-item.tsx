import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"

// WF / Come-back list item: flag, "Name · CODE", where and why, "Go to".
export function ComeBackListItem({ title, where, onGoTo }: { title: string; where: string; onGoTo: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card py-2 pr-2 pl-3">
      <Flag className="size-4 shrink-0 text-primary" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="truncate text-xs text-muted-foreground">{where}</span>
      </div>
      <Button size="sm" variant="outline" className="text-xs" onClick={onGoTo}>
        Go to
      </Button>
    </div>
  )
}

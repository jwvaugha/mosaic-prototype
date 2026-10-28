import { cn } from "@/lib/utils"

// A plain progress bar; value is 0–1.
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
    </div>
  )
}

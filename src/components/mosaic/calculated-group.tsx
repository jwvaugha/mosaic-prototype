import { Calculator, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { Variable } from "@/data/types"

// Calculated Variables (radii, angles, arcs, fractions): about 40 cranial
// Variables that FORDISC derives from the linear measurements, so they're
// never typed (requirements: Cranial Metrics). Read-only rows, outside the
// Tab order, collapsed by default. Values appear once the formulas from
// FORDISC are in; until then they show "—".

export function CalculatedGroup({ variables }: { variables: Variable[] }) {
  const [open, setOpen] = useState(false)
  return (
    <section aria-label="Calculated" className="flex w-[760px] flex-col gap-1">
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 items-center gap-3 rounded-lg px-3 text-left hover:bg-muted/50"
      >
        <ChevronDown className={open ? "size-4" : "size-4 -rotate-90"} />
        <span className="text-lg font-semibold">Calculated</span>
        <span className="text-xs text-muted-foreground">
          {variables.length} Variables filled in from your measurements · nothing to enter
        </span>
      </button>
      {open &&
        variables.map((v) => (
          <div key={v.id} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-muted-foreground">
            <Calculator className="size-4 shrink-0" />
            <div className="w-[324px] shrink-0 leading-5">
              <span className="text-sm font-medium text-foreground/80">{v.name}</span>
              <span className="ml-2 inline-block font-mono text-xs">{v.code}</span>
            </div>
            <span className="w-[200px] rounded-lg border border-dashed px-3 py-1.5 text-sm">
              — <span className="float-right">{v.unit}</span>
            </span>
            <Badge variant="secondary" className="ml-auto">
              Calculated
            </Badge>
          </div>
        ))}
    </section>
  )
}

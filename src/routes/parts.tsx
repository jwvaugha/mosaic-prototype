import type { ReactNode } from "react"
import { BoneGroupHeader } from "@/components/mosaic/bone-group-header"
import { KeyHint } from "@/components/mosaic/key-hint"
import { MetricVariableRow } from "@/components/mosaic/metric-variable-row"
import { MorphVariableRow } from "@/components/mosaic/morph-variable-row"
import { fixture } from "@/data"
import type { FieldStatus } from "@/domain/workup"

// Every MOSAIC component in every state, in isolation (spec: components are
// checked here before they're used in a screen).

const noop = () => {}
const v = fixture.variables

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

const morphCases: { id: string; status: FieldStatus; value: string | null; focused?: boolean; label: string }[] = [
  { id: "NAS", status: "unreached", value: null, label: "Unreached" },
  { id: "NAW", status: "unreached", value: null, focused: true, label: "Focused" },
  { id: "NBC", status: "recorded", value: "2", label: "Recorded" },
  { id: "INA", status: "skipped", value: null, label: "Skipped" },
]

const metricCases: { id: string; status: FieldStatus; value: string | null; focused?: boolean }[] = [
  { id: "FemXL", status: "unreached", value: null },
  { id: "FemBL", status: "unreached", value: null, focused: true },
  { id: "FemEB", status: "recorded", value: "82" },
  { id: "FemHXD", status: "warning", value: "64" },
  { id: "TibDEB", status: "acknowledged", value: "62" },
  { id: "FemMWD", status: "skipped", value: null },
]

export function Parts() {
  return (
    <main className="flex flex-col gap-10 p-8">
      <header className="flex flex-col gap-1">
        <a className="text-sm text-muted-foreground" href="#/">
          ← Prototype
        </a>
        <h1 className="text-2xl font-semibold">MOSAIC parts</h1>
        <p className="text-muted-foreground">
          Custom components built on shadcn/ui, in every state. Hover a row to see its actions.
        </p>
      </header>

      <Group title="KeyHint">
        <div className="flex flex-wrap gap-6">
          <KeyHint keys="-" label="Skip" />
          <KeyHint keys="-" label="Un-skip" />
          <KeyHint keys="⇧-" label="Skip bone" />
          <KeyHint keys={["⌥", "F"]} label="Come back to this" />
          <KeyHint keys="?" label="Reference" />
          <KeyHint keys={["⌃", "⌥", "↓"]} label="Next section" />
        </div>
      </Group>

      <Group title="BoneGroupHeader + MorphVariableRow (Cranium · Morphological)">
        <BoneGroupHeader
          name="Nasal aperture and bones"
          counts={{ total: 6, recorded: 1, skipped: 1, flagged: 0 }}
          actions={<KeyHint keys="⇧-" label="Skip bone" />}
        />
        {morphCases.map((c) => (
          <MorphVariableRow
            key={c.id}
            variable={v[c.id]}
            status={c.status}
            value={c.value}
            focused={!!c.focused}
            hasReference
            onSelect={noop}
            onFocus={noop}
            actions={<KeyHint keys="-" label={c.status === "skipped" ? "Un-skip" : "Skip"} />}
          />
        ))}
      </Group>

      <Group title="BoneGroupHeader + MetricVariableRow (Lower limb · Metric)">
        <BoneGroupHeader name="Femur" counts={{ total: 6, recorded: 3, skipped: 1, flagged: 0 }} />
        {metricCases.map((c) => (
          <MetricVariableRow
            key={c.id}
            variable={v[c.id]}
            status={c.status}
            value={c.value}
            focused={!!c.focused}
            hasReference={c.id !== "FemMWD"}
            onCommit={noop}
            onFocus={noop}
            onAcknowledge={noop}
            actions={<KeyHint keys="-" label={c.status === "skipped" ? "Un-skip" : "Skip"} />}
          />
        ))}
      </Group>
    </main>
  )
}

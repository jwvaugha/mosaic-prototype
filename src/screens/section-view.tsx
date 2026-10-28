import { BoneGroupHeader } from "@/components/mosaic/bone-group-header"
import { ContinueFooter } from "@/components/mosaic/continue-footer"
import { MetricVariableRow } from "@/components/mosaic/metric-variable-row"
import { MorphVariableRow } from "@/components/mosaic/morph-variable-row"
import { useConfig } from "@/config/config-context"
import { imageManifest } from "@/data"
import {
  adjacentSection,
  fieldStatus,
  sameFocus,
  sectionCounts,
  sections,
  variable,
} from "@/domain/workup"
import { boneAffordances, rowAffordances } from "@/policies/row-affordances"
import { focusKey, useWorkup } from "@/workup/workup-context"

export function SectionView({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch, register } = useWorkup()
  const { config, policy } = useConfig()
  const section = sections.find((s) => s.id === state.section)!
  const next = adjacentSection(section.id, 1)
  const counts = sectionCounts(state, section.id)

  const summary = [
    `${counts.recorded} of ${counts.total} recorded`,
    counts.skipped && `${counts.skipped} skipped`,
    counts.flagged && `${counts.flagged} to come back to`,
    `${counts.blank} blank`,
  ]
    .filter(Boolean)
    .join(" · ")

  const focusField = (id: string) => {
    if (!sameFocus(state.focus, { kind: "field", id })) dispatch({ type: "focus", focus: { kind: "field", id } })
  }

  return (
    <div className="flex flex-col pb-24">
      <header className="mb-2 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{section.title}</h1>
        <p className="text-muted-foreground">{summary}</p>
      </header>

      {section.bones.map((bone) => {
        const boneCounts = { total: 0, recorded: 0, skipped: 0, flagged: 0 }
        for (const id of bone.variableIds) {
          const s = fieldStatus(state, id)
          boneCounts.total++
          if (s === "skipped") boneCounts.skipped++
          else if (s !== "unreached") boneCounts.recorded++
          if (state.fields[id].flag) boneCounts.flagged++
        }
        return (
          <section key={bone.id} aria-label={bone.name}>
            <BoneGroupHeader
              name={bone.name}
              counts={boneCounts}
              actions={boneAffordances(policy, config.showKeyHints)}
            />
            {bone.variableIds.map((id) => {
              const v = variable(id)
              const field = state.fields[id]
              const status = fieldStatus(state, id)
              const focused = focusKey(state.focus) === id
              const row = {
                variable: v,
                status,
                focused,
                hasReference: imageManifest[id]?.kind !== "none",
                onOpenReference: () => {
                  focusField(id)
                  dispatch({ type: "openReference", by: "manual" })
                },
                ...rowAffordances(policy, field, status, config.showKeyHints),
              }
              return v.modality === "metric" ? (
                <MetricVariableRow
                  key={id}
                  {...row}
                  value={field.value}
                  inputRef={register(id)}
                  onFocus={() => focusField(id)}
                  onCommit={(value) => dispatch({ type: "enter", id, value })}
                  onAcknowledge={() => dispatch({ type: "acknowledge", id })}
                />
              ) : (
                <MorphVariableRow
                  key={id}
                  {...row}
                  value={field.value}
                  groupRef={register(id)}
                  onFocus={() => focusField(id)}
                  onSelect={(code) => dispatch({ type: "enter", id, value: code })}
                />
              )
            })}
          </section>
        )
      })}

      <ContinueFooter
        title={section.title}
        summary={summary}
        nextTitle={next?.title ?? null}
        showKeyHints={config.showKeyHints}
        buttonRef={register(`continue:${section.id}`)}
        onFocus={() => {
          const f = { kind: "continue", section: section.id } as const
          if (!sameFocus(state.focus, f)) dispatch({ type: "focus", focus: f })
        }}
        onContinue={onContinue}
      />
    </div>
  )
}

import { FileUp } from "lucide-react"
import { useLayoutEffect, useState } from "react"
import { BoneGroupHeader } from "@/components/mosaic/bone-group-header"
import { CalculatedGroup } from "@/components/mosaic/calculated-group"
import { ContinueFooter } from "@/components/mosaic/continue-footer"
import { MetricVariableRow } from "@/components/mosaic/metric-variable-row"
import { FirstUseHint } from "@/components/mosaic/first-use-hint"
import { InlineExpansion } from "@/components/mosaic/reference/presenters"
import type { ReferenceData } from "@/components/mosaic/reference/reference-parts"
import { MorphVariableRow } from "@/components/mosaic/morph-variable-row"
import { Button } from "@/components/ui/button"
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
import { useRail } from "@/workup/rail-context"
import { focusKey, useWorkup } from "@/workup/workup-context"

// The main pane (wireframe "Main pane"): header, bone groups 24 px apart with
// rows 4 px apart, then the section footer.

export function SectionView({
  onContinue,
  inlineReference,
}: {
  onContinue: () => void
  // Presenter C renders under the focused row.
  inlineReference: { data: ReferenceData | null; close: () => void } | null
}) {
  const { state, dispatch, register, focusNow } = useWorkup()
  const { config, policy } = useConfig()
  const section = sections.find((s) => s.id === state.section)!
  const { sectionOrder } = useRail()
  const next = adjacentSection(section.id, 1, sectionOrder)
  const c = sectionCounts(state, section.id)

  const head = [`${c.recorded} of ${c.total} recorded`]
  if (c.skipped) head.push(`${c.skipped} skipped`)
  if (c.flagged) head.push(`${c.flagged} to come back to`)
  const pane = [...head, `${c.blank} remaining`].join(" · ")
  const footer = [...head, `${c.blank} unreached`].join(" · ")

  const hintField = state.focus?.kind === "field" ? variable(state.focus.id) : null
  // The row exists only after render, so find it in an effect.
  const [hintAnchor, setHintAnchor] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    setHintAnchor(
      hintField ? document.querySelector<HTMLElement>(`[data-variable="${hintField.id}"] > div`) : null,
    )
  }, [hintField?.id, section.id])
  const scoreIt = hintField?.states
    ? `Type or click ${hintField.states[0].code}–${hintField.states.at(-1)!.code} to score ${hintField.name}.`
    : `Type the ${hintField?.name.toLowerCase()} in ${hintField?.unit}.`
  const hintCopy = policy.allowSkip
    ? {
        title: "Score it, or Skip it",
        body: `${scoreIt} If you can't score it, press “−” to Skip. Skipped fields count as done, and MOSAIC won't ask about them again.`,
        note: "Leave a field blank only if you mean to come back to it.",
        keys: "-",
        keyLabel: "Skip this field",
      }
    : {
        title: "Score it, or come back to it",
        body: `${scoreIt} Not ready to score it? Press ⌥F to flag it, and MOSAIC will list it again before the Analysis.`,
        note: "Fields you leave blank are fine: they're left out of the Analysis.",
        keys: "⌥F",
        keyLabel: "Come back to this",
      }

  const focusField = (id: string) => {
    if (!sameFocus(state.focus, { kind: "field", id })) dispatch({ type: "focus", focus: { kind: "field", id } })
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex w-[720px] flex-col gap-1">
        <div className="flex h-8 items-center gap-4">
          <h1 className="text-2xl font-semibold">{section.title}</h1>
          {section.modality === "metric" && (
            <Button variant="outline" size="sm" tabIndex={-1} className="ml-auto text-xs">
              <FileUp /> Import from 3Skull / FORDISC file
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{pane}</p>
      </header>

      <div className="flex flex-col gap-6">
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
            <section key={bone.id} aria-label={bone.name} className="flex flex-col gap-1">
              <BoneGroupHeader
                name={bone.name}
                counts={boneCounts}
                bilateral={!!bone.bilateral}
                sideLabel={section.modality === "morph" ? "Side scored" : "Side"}
                actions={boneAffordances(policy, config.showKeyHints)}
              />
              {bone.variableIds.map((id) => {
                const v = variable(id)
                const field = state.fields[id]
                const status = fieldStatus(state, id)
                const row = {
                  onSelectRow: () => {
                    focusField(id)
                    focusNow(id)
                  },
                  variable: v,
                  status,
                  focused: focusKey(state.focus) === id,
                  hasReference: imageManifest[id]?.kind !== "none",
                  onOpenReference: () => {
                    focusField(id)
                    dispatch({ type: "openReference" })
                  },
                  ...rowAffordances({
                    policy,
                    name: v.name,
                    field,
                    status,
                    focused: focusKey(state.focus) === id,
                    showKeyHints: config.showKeyHints,
                    onToggleFlag: () => dispatch({ type: "toggleFlag", id }),
                    onFlagReason: (reason) => dispatch({ type: "setFlagReason", id, reason }),
                  }),
                  below:
                    inlineReference?.data?.variable.id === id ? (
                      <InlineExpansion data={inlineReference.data} onClose={inlineReference.close} />
                    ) : undefined,
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
                    onUnacknowledge={() => dispatch({ type: "unacknowledge", id })}
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
      </div>

      {section.calculated && <CalculatedGroup variables={section.calculated.map(variable)} />}

      <FirstUseHint
        open={!state.firstUseHintSeen && state.focus?.kind === "field"}
        anchor={hintAnchor}
        onDismiss={() => dispatch({ type: "dismissHint" })}
        {...hintCopy}
      />

      <ContinueFooter
        title={section.title}
        summary={footer}
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

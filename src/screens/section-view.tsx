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
  type Focus,
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
  // The card sits to the right of the field's input (its state buttons or
  // number box). The row exists only after render, so find it in an effect.
  const [hintAnchor, setHintAnchor] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    const row = hintField ? document.querySelector<HTMLElement>(`[data-variable="${hintField.id}"]`) : null
    setHintAnchor(row?.querySelector<HTMLElement>(`[id="field-${hintField!.id}"]`) ?? row)
  }, [hintField?.id, section.id])
  // General on purpose: it explains the pattern, not the field it opens on.
  const hintCopy =
    policy.allowSkip && policy.allowFlag
      ? {
          title: "Score it, Skip it, or come back to it",
          body: "Click or type a state's number to score a trait, or type a measurement. If something can't be scored, Skip it. If you'll score it later, mark it to come back to; MOSAIC lists those again before the Analysis.",
          note: "Both are also on each row's buttons when you point at it.",
          keys: [
            ["−", "Skip"],
            ["⌥F", "Come back"],
            ["R", "Reference"],
          ] as [string, string][],
        }
      : policy.allowSkip
        ? {
            title: "Score it, or Skip it",
            body: "Click or type a state's number to score a trait, or type a measurement. If something can't be scored, Skip it. Skipped fields count as done, and MOSAIC won't ask about them again.",
            note: "Leave a field blank only if you mean to come back to it.",
            keys: [["−", "Skip"]] as [string, string][],
          }
        : {
            title: "Score it, or come back to it",
            body: "Click or type a state's number to score a trait, or type a measurement. Not ready to score something? Mark it to come back to, and MOSAIC lists it again before the Analysis.",
            note: "Fields you leave blank are fine: they're left out of the Analysis.",
            keys: [["⌥F", "Come back"]] as [string, string][],
          }
  const hintOpen = !state.firstUseHintSeen && state.focus?.kind === "field"

  const focusStop = (f: Focus) => {
    if (!sameFocus(state.focus, f)) dispatch({ type: "focus", focus: f })
  }

  const focusField = (id: string) => {
    if (!sameFocus(state.focus, { kind: "field", id })) dispatch({ type: "focus", focus: { kind: "field", id } })
  }

  return (
    // Rows fill the pane up to 960 px, so their Skip / Come back buttons have
    // room inline; with the docked column open the pane is about 720 px.
    <div className="flex w-full max-w-[960px] min-w-0 flex-col gap-6 pb-24">
      <header className="flex w-full flex-col gap-1">
        <div className="flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold">{section.title}</h1>
          {section.modality === "metric" && (
            <Button variant="outline" size="sm" tabIndex={-1} className="ml-auto text-xs">
              <FileUp /> <span className="hidden md:inline">Import from 3Skull / FORDISC file</span>
              <span className="md:hidden">Import</span>
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
                id={bone.id}
                name={bone.name}
                focused={state.focus?.kind === "bone" && state.focus.id === bone.id}
                conditionsFocused={state.focus?.kind === "conditions" && state.focus.id === bone.id}
                headerRef={register(`bone:${bone.id}`)}
                conditionsRef={register(`conditions:${bone.id}`)}
                onFocusHeader={() => focusStop({ kind: "bone", id: bone.id })}
                onFocusConditions={() => focusStop({ kind: "conditions", id: bone.id })}
                counts={boneCounts}
                bilateral={!!bone.bilateral}
                sideLabel={section.modality === "morph" ? "Side scored" : "Side"}
                actions={boneAffordances(policy, config.showKeyHints, () => dispatch({ type: "toggleSkipBone", boneId: bone.id }))}
              />
              {bone.variableIds.map((id) => {
                const v = variable(id)
                const field = state.fields[id]
                const status = fieldStatus(state, id)
                const row = {
                  showKeyHints: config.showKeyHints,
                  spotlight: hintOpen && config.introDim && focusKey(state.focus) === id,
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
                    modality: v.modality,
                    field,
                    status,
                    focused: focusKey(state.focus) === id,
                    showKeyHints: config.showKeyHints,
                    onToggleSkip: () => dispatch({ type: "toggleSkip", id }),
                    onToggleFlag: () => dispatch({ type: "toggleFlag", id }),
                    onClear: () => dispatch({ type: "clear", id }),
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
                    onClear={() => dispatch({ type: "clear", id })}
                  />
                )
              })}
            </section>
          )
        })}
      </div>

      {section.calculated && <CalculatedGroup variables={section.calculated.map(variable)} />}

      {/* intro-dim: everything but the field's row is dimmed while the card shows. */}
      {hintOpen && config.introDim && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/40"
          onMouseDown={(e) => {
            e.preventDefault()
            dispatch({ type: "dismissHint" })
          }}
        />
      )}

      <FirstUseHint
        open={hintOpen}
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

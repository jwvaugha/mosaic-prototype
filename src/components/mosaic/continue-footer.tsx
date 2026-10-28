import { ArrowRight } from "lucide-react"
import type { Ref } from "react"
import { Button } from "@/components/ui/button"
import { KeyHint } from "./key-hint"

// The end of a section (Explorations 3A): counts and the one explicit way on.
// Tab from the last row lands on the button; Enter presses it.

export function ContinueFooter({
  title,
  summary,
  nextTitle,
  showKeyHints,
  buttonRef,
  onFocus,
  onContinue,
}: {
  title: string
  summary: string
  // null in the last section, where the button opens the pre-Analysis check.
  nextTitle: string | null
  showKeyHints: boolean
  buttonRef?: Ref<HTMLButtonElement>
  onFocus?: () => void
  onContinue: () => void
}) {
  return (
    <div data-continue className="mt-8 flex w-[760px] items-center gap-6 rounded-xl border px-5 py-4">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="font-semibold">End of {title}</span>
        <span className="text-sm text-muted-foreground">{summary}</span>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Button ref={buttonRef} onFocus={onFocus} onClick={onContinue} className="h-10 px-4">
          {nextTitle ? `Continue to ${nextTitle}` : "Review and analyze"}
          <ArrowRight data-icon="inline-end" />
        </Button>
        {showKeyHints && nextTitle && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Enter, or from anywhere <KeyHint keys={["⌃", "⌥", "↓"]} />
          </span>
        )}
      </div>
    </div>
  )
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ComeBackListItem } from "./come-back-list-item"

// Section checks on Continue.
//   Flows 1.3: blanks in the Skip version (Alert Dialog). "Skip N and
//              continue" is the default action.
//   Flows 2.3: flags in the come-back version, listed with "Go to".

export function SkipCheckDialog({
  open,
  sectionTitle,
  blankNames,
  onGoToFirst,
  onSkipAll,
  onClose,
}: {
  open: boolean
  sectionTitle: string
  blankNames: string[]
  onGoToFirst: () => void
  onSkipAll: () => void
  onClose: () => void
}) {
  const n = blankNames.length
  const listed =
    n <= 2 ? blankNames.join(" and ") : `${blankNames.slice(0, 2).join(", ")} and ${n - 2} more`
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="sm:max-w-[512px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">
            {n} {n === 1 ? "field" : "fields"} in {sectionTitle} {n === 1 ? "is" : "are"} blank
          </AlertDialogTitle>
          <AlertDialogDescription>
            Mark them Skipped and move on, or go back and fill them in. Skipped fields are left out of the
            Analysis, and MOSAIC won't ask about them again. Blank: {listed}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onGoToFirst}>Go to first blank</AlertDialogCancel>
          <AlertDialogAction autoFocus onClick={onSkipAll}>
            Skip {n} and continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function FlagCheckDialog({
  open,
  sectionTitle,
  nextTitle,
  flagged,
  otherBlank,
  onGoTo,
  onStay,
  onContinue,
}: {
  open: boolean
  sectionTitle: string
  nextTitle: string
  flagged: { id: string; title: string; where: string }[]
  otherBlank: number
  onGoTo: (id: string) => void
  onStay: () => void
  onContinue: () => void
}) {
  const n = flagged.length
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onStay()}>
      <DialogContent showCloseButton={false} className="gap-4 sm:max-w-[512px]">
        <div className="flex flex-col gap-1.5">
          <DialogTitle className="text-lg">
            {n} {n === 1 ? "field" : "fields"} to come back to in {sectionTitle}
          </DialogTitle>
          <DialogDescription>
            You flagged these before moving on. They stay flagged, and they'll be listed again before you run the
            Analysis.
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-2">
          {flagged.map((f) => (
            <ComeBackListItem key={f.id} title={f.title} where={f.where} onGoTo={() => onGoTo(f.id)} />
          ))}
        </div>
        {otherBlank > 0 && (
          <p className="text-xs text-muted-foreground">
            {otherBlank} other {otherBlank === 1 ? "field is" : "fields are"} blank. That's fine: blank fields are
            left out of the Analysis.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={onStay}>
            Stay in this section
          </Button>
          <Button size="sm" autoFocus className="text-xs" onClick={onContinue}>
            Continue to {nextTitle}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

// Toast · Skipped (Flows 1.4): message, Undo, ⌘Z.
export function showUndoToast(message: string, onUndo: () => void) {
  return toast.custom(
    (id) => (
      <div className="flex w-[487px] items-center gap-3 rounded-[10px] border bg-background py-3 pr-3 pl-4 shadow-lg">
        <span className="flex-1 text-sm">{message}</span>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => {
            onUndo()
            toast.dismiss(id)
          }}
        >
          Undo
        </Button>
        <Kbd>⌘Z</Kbd>
      </div>
    ),
    { duration: 8000, position: "bottom-center" },
  )
}

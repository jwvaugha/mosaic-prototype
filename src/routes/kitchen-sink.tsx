import type { ReactNode } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Raw shadcn primitives in the Mosaic theme, for checking against the
// Mosaic-shadcn Figma library before any MOSAIC component is built on them.

const SWATCHES = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  "destructive",
  "warning",
  "warning-muted",
  "success",
  "success-muted",
  "sidebar",
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
      <Separator className="mt-4" />
    </section>
  )
}

export function KitchenSink() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-1">
        <a className="text-sm text-muted-foreground" href="#/">
          ← Prototype
        </a>
        <h1 className="text-2xl font-semibold">Kitchen sink</h1>
        <p className="text-muted-foreground">
          shadcn/ui primitives with tokens from the Mosaic-shadcn Figma library.
        </p>
      </header>

      <Section title="Tokens">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SWATCHES.map((name) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div
                className="h-12 rounded-md border"
                style={{ background: `var(--${name})` }}
              />
              <span className="font-mono text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <p className="text-2xl font-semibold">Pelvis · Morphological</p>
        <p className="text-base">
          Greater sciatic notch — score the shape of the notch with the ilium oriented
          laterally.
        </p>
        <p className="text-sm text-muted-foreground">
          12 of 84 recorded · 71 unreached
        </p>
        <p className="font-mono text-sm">FemXL 448.0 mm · GOL 182 · NBC_2</p>
      </Section>

      <Section title="Button, Kbd, Button group">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Continue to Lower limb · Metric</Button>
          <Button variant="outline">Go to first blank</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Remove</Button>
          <Button variant="link">Link</Button>
          <Button size="sm" variant="outline">
            Skip <Kbd>-</Kbd>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Kbd>-</Kbd>
          <Kbd>⇧-</Kbd>
          <KbdGroup>
            <Kbd>⌥</Kbd>
            <Kbd>F</Kbd>
          </KbdGroup>
          <Kbd>?</Kbd>
          <KbdGroup>
            <Kbd>⌃</Kbd>
            <Kbd>⌥</Kbd>
            <Kbd>↓</Kbd>
          </KbdGroup>
          <ButtonGroup>
            <Button variant="outline" size="sm">
              Left
            </Button>
            <Button variant="outline" size="sm">
              Right
            </Button>
          </ButtonGroup>
        </div>
      </Section>

      <Section title="Field, Input group, Toggle group">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="femxl">Maximum length of the femur</FieldLabel>
            <InputGroup>
              <InputGroupInput id="femxl" inputMode="decimal" placeholder="—" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>mm · 1</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>FemXL · DCP 2.0 #75</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Nasal bone contour</FieldLabel>
            <ToggleGroup type="single" variant="outline" size="sm" defaultValue="2">
              {["0", "1", "2", "3", "4"].map((s) => (
                <ToggleGroupItem key={s} value={s} aria-label={`State ${s}`}>
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>NBC · digit keys select a state</FieldDescription>
          </Field>
        </div>
      </Section>

      <Section title="Badge, Item, Switch, Radio group">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Come back to</Badge>
          <Badge variant="destructive">Out of bounds</Badge>
        </div>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Greater sciatic notch</ItemTitle>
            <ItemDescription>Pelvis · Morphological · Re-measure</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">
              Go to
            </Button>
          </ItemActions>
        </Item>
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-2">
            <Switch id="auto-morph" defaultChecked />
            <Label htmlFor="auto-morph">Auto-show for Morphological</Label>
          </div>
          <RadioGroup defaultValue="A" className="flex gap-4">
            {["A", "B", "C"].map((v) => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`layout-${v}`} />
                <Label htmlFor={`layout-${v}`}>{v}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Alert dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  18 fields in Pelvis · Morphological are blank
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Skip them and continue, or go back to the first blank field.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go to first blank</AlertDialogCancel>
                <AlertDialogAction>Skip 18 and continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Before you run the analysis</DialogTitle>
                <DialogDescription>Counts, not values.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Prototype controls</SheetTitle>
                <SheetDescription>Test mode only.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm">Why come back to this?</PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Open reference</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            onClick={() =>
              toast("Skipped 18 fields in Pelvis · Morphological", {
                action: { label: "Undo", onClick: () => {} },
              })
            }
          >
            Toast
          </Button>
        </div>
      </Section>
    </main>
  )
}

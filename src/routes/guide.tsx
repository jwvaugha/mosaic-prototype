import { ArrowRight, Check, ClipboardCopy, FlaskConical, Keyboard, MessageSquareText, MousePointerClick } from "lucide-react"
import { useState, useSyncExternalStore, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { getEvents, subscribeEvents } from "@/lib/event-log"

// The how-to for testers using the prototype on their own (asynchronously).
// Each setup is a link that opens a fresh Workup with that configuration;
// the session log keeps running across them.

const base = import.meta.env.BASE_URL

type Setup = { id: string; title: string; what: string; query: string }

const PART_1: Setup[] = [
  {
    id: "1",
    title: "Setup 1 · Skip",
    what: "Press − to Skip a field you can't score. Leaving a section with blank fields asks whether to Skip them all.",
    query: "inc=skip-section&ref=A,A&auto=morph,metric&seed=fresh&start=cranium-morph",
  },
  {
    id: "2",
    title: "Setup 2 · Come back to, checked per section",
    what: "No Skip. Press ⌥F to flag a field to come back to. Leaving a section lists your flags.",
    query: "inc=flag-section&ref=A,A&auto=morph,metric&seed=fresh&start=cranium-morph",
  },
  {
    id: "2.5",
    title: "Setup 3 · Come back to, checked at the end",
    what: "Same flags, but nothing stops you between sections. Flags are listed once, before the Analysis.",
    query: "inc=flag-end&ref=A,A&auto=morph,metric&seed=fresh&start=cranium-morph",
  },
]

const PART_2: Setup[] = [
  {
    id: "A",
    title: "Setup 4 · Docked column",
    what: "The reference sits in a column on the right and never moves.",
    query: "inc=flag-end&ref=A,A&auto=morph,metric&seed=fresh&start=cranium-morph",
  },
  {
    id: "C",
    title: "Setup 5 · Inline, under the field",
    what: "The reference opens directly under the field you're on. The page scrolls to keep your place.",
    query: "inc=flag-end&ref=C,C&auto=morph,metric&seed=fresh&start=cranium-morph",
  },
  {
    id: "D",
    title: "Setup 6 · Bottom dock",
    what: "The reference is a strip across the bottom of the screen.",
    query: "inc=flag-end&ref=D,D&auto=morph,metric&seed=fresh&start=cranium-morph",
  },
]

const KEYS: [ReactNode, string][] = [
  [<Kbd key="t">Tab</Kbd>, "Next field (⇧Tab goes back). The last Tab in a section lands on Continue."],
  [<Kbd key="d">0–9</Kbd>, "Score a Morphological trait by its number, and move on"],
  [<Kbd key="e">Enter</Kbd>, "Keep a measurement and move on; on Continue, go to the next section"],
  [<Kbd key="m">−</Kbd>, "Skip the field (Setup 1). ⇧− skips the whole bone. Press − again to un-Skip."],
  [<KbdGroup key="f"><Kbd>⌥</Kbd><Kbd>F</Kbd></KbdGroup>, "Mark the field to come back to (Setups 2–6). Press again to unmark."],
  [<Kbd key="q">?</Kbd>, "Show or hide the reference for the field. Esc hides it."],
  [<KbdGroup key="s"><Kbd>⌃</Kbd><Kbd>⌥</Kbd><Kbd>↓</Kbd></KbdGroup>, "Next section from anywhere (↑ for the previous one)"],
  [<Kbd key="f6">F6</Kbd>, "Jump to the Regions list on the left; arrows move, Enter opens, Esc comes back"],
]

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="flex gap-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </section>
  )
}

function SetupCard({ s }: { s: Setup }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-medium">{s.title}</span>
        <span className="text-sm text-muted-foreground">{s.what}</span>
      </div>
      <Button asChild size="sm">
        <a href={`${base}?${s.query}#/`} target="_blank" rel="noreferrer">
          Start <ArrowRight data-icon="inline-end" />
        </a>
      </Button>
    </div>
  )
}

function Questions({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl bg-muted/60 p-4">
      <span className="flex items-center gap-2 text-sm font-medium">
        <MessageSquareText className="size-4" /> After each setup, jot down
      </span>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
    </div>
  )
}

export function Guide() {
  const events = useSyncExternalStore(subscribeEvents, getEvents)
  const [copied, setCopied] = useState(false)

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <a className="text-sm text-muted-foreground" href="#/">
          ← Back to the prototype
        </a>
        <Badge variant="outline" className="w-fit">
          <FlaskConical /> Prototype · about 30 minutes
        </Badge>
        <h1 className="text-3xl font-semibold">Testing the MOSAIC data-entry prototype</h1>
        <p className="text-muted-foreground">
          Thanks for trying this. It's a working mock-up of how practitioners will enter measurements and
          observations in MOSAIC. We're deciding between a few designs, and your honest reactions are the point:
          there are no wrong answers, and confusion is useful data.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <span className="text-sm font-medium">Question 1 · Fields you can't do yet</span>
          <p className="mt-1 text-sm text-muted-foreground">
            When you can't score something right now, should you mark it <em>Skipped</em>, or flag it to{" "}
            <em>come back to</em>? And when should MOSAIC remind you?
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <span className="text-sm font-medium">Question 2 · The reference drawings</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Where should the reference drawing for the field you're on appear, so it helps without getting in the
            way?
          </p>
        </div>
      </div>

      <Step n="1" title="Before you start">
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>Use a laptop or desktop with a keyboard, in Chrome, Safari, Firefox or Edge. Touch screens aren't supported yet.</li>
          <li>
            The data is made up. <strong>Don't enter real case information.</strong> Nothing you type leaves your
            browser.
          </li>
          <li>
            Every Region and section from the data dictionaries is here (about 370 fields), so it feels like a real
            case. You won't fill them all: the tasks below use a few groups. Use the <strong>Regions</strong> list on
            the left to move around.
          </li>
          <li>
            You can use the mouse or the keyboard. Try the keyboard at least once (keys are listed below). Clicking
            any field selects it.
          </li>
          <li>
            Each <strong>Start</strong> button opens a fresh copy in a new tab. Your activity is recorded in your
            browser across all of them, so you only send it once at the end.
          </li>
        </ul>
      </Step>

      <Step n="2" title="Part 1 · Fields you can't do yet (setups 1–3)">
        <p className="text-sm">
          Do the <strong>same task</strong> in each setup, in order:
        </p>
        <ol className="list-decimal space-y-1.5 rounded-xl border p-4 pl-9 text-sm">
          <li>
            Each setup opens on <strong>Cranium · Morphological</strong>. Score the first two groups,{" "}
            <strong>Nasal aperture and bones</strong> and <strong>Zygomatic and orbit</strong>. Any state will do:
            compare with the drawing if you like.
          </li>
          <li>
            <strong>Except</strong> Posterior zygomatic tubercle and Interorbital breadth: imagine a colleague has
            the skull for now. Deal with those two however the setup suggests.
          </li>
          <li>
            Leave the rest of the section and press <strong>Continue</strong> at the bottom (or keep pressing Tab to
            reach it). Respond to whatever it asks.
          </li>
          <li>
            Open <strong>Lower limb › Metric</strong> from the Regions list. Enter FemXL <strong>452</strong>, FemBL{" "}
            <strong>448</strong>, FemHXD <strong>64</strong> and TibCML <strong>371</strong>. You'll measure the rest
            later.
          </li>
          <li>
            Click <strong>Analyze</strong> in the top right, look over the check, then <strong>Run analysis</strong>.
          </li>
        </ol>
        <div className="flex flex-col gap-2">
          {PART_1.map((s) => (
            <SetupCard key={s.id} s={s} />
          ))}
        </div>
        <Questions
          items={[
            "Was it clear how to mark the two fields you couldn't do?",
            "Did the reminder (when leaving a section, or before the Analysis) help, or get in the way?",
            "Before running, could you tell what was still left, and why?",
          ]}
        />
      </Step>

      <Step n="3" title="Part 2 · The reference drawings (setups 4–6)">
        <p className="text-sm">In each setup:</p>
        <ol className="list-decimal space-y-1.5 rounded-xl border p-4 pl-9 text-sm">
          <li>
            Tab through the first two groups of <strong>Cranium · Morphological</strong> and score each trait by
            comparing it with the drawings. Hover the small drawings to compare states; click a drawing to enlarge
            it.
          </li>
          <li>
            Open <strong>Lower limb › Metric</strong> from the Regions list and tab through a few measurements,
            reading each definition.
          </li>
        </ol>
        <div className="flex flex-col gap-2">
          {PART_2.map((s) => (
            <SetupCard key={s.id} s={s} />
          ))}
        </div>
        <Questions
          items={[
            "Where did your eyes go after each key press: the field, or the drawing?",
            "Did anything move when you didn't expect it to?",
            "Could you make out the differences between states?",
            "Which of the three would you want for a long session at the bench?",
          ]}
        />
        <p className="text-xs text-muted-foreground">
          The Morphological drawings are MSU's own. The Metric drawings are shown as grey boxes of the right size for
          now; that's expected.
        </p>
      </Step>

      <Step n="4" title="Send your results">
        <p className="text-sm">
          Copy your session log and paste it into a message to Jackson, along with your notes and your favourite
          setup from each part. The log has only keys, clicks and timings: no values you typed.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({ copiedAt: new Date().toISOString(), events }, null, 2))
              setCopied(true)
            }}
          >
            {copied ? <Check /> : <ClipboardCopy />} {copied ? "Copied" : "Copy session log"}
          </Button>
          <span className="text-sm text-muted-foreground">{events.length} entries recorded so far</span>
        </div>
      </Step>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Keyboard className="size-5" /> Keys
        </h2>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-sm">
          {KEYS.map(([k, d], i) => (
            <div key={i} className="contents">
              <dt className="justify-self-start">{k}</dt>
              <dd className="text-muted-foreground">{d}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MousePointerClick className="size-4" /> On a PC, ⌥ is Alt and ⌃ is Ctrl.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm">
        <h2 className="text-lg font-semibold">Good to know</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Reloading the page starts the Workup again. That's a limit of the prototype; the real app saves as you
            go.
          </li>
          <li>
            The <strong>Test mode</strong> button in the bottom-left corner shows the setup you're in. You don't need
            it for this guide, but feel free to explore.
          </li>
          <li>
            Out-of-range values (like FemHXD 64) show a warning you can acknowledge. That's intended: warnings never
            block you.
          </li>
          <li>Something broken or confusing? Note what you did just before, and include it with your results.</li>
        </ul>
      </section>
    </main>
  )
}

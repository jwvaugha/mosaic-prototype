import { ArrowRight, Check, ClipboardCopy, FlaskConical, Keyboard, Mail, MousePointerClick } from "lucide-react"
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { getEvents, subscribeEvents } from "@/lib/event-log"

// The guide for testers (the PIs) using the prototype on their own. Since
// 2026-10-29 it asks for open-ended feedback in a few groups instead of
// setting a task per layout; trying the other reference layouts is optional.
// Answers are typed into boxes after each group, kept in this browser (so the
// guide can be closed and reopened from the bottom-right corner), and sent as
// an email the tester's own mail app opens.

// Where the feedback email goes. Empty leaves the To line for the tester.
const FEEDBACK_EMAIL = ""
const ANSWERS_KEY = "mosaic-proto:guide-answers"

type Answers = Record<string, string>

// Each group ends in one response box; `prompt` heads that group in the email.
const GROUPS = {
  around: "Getting around",
  layout: "Layout: are things where you expected them?",
  reference: "The reference panel",
  skip: 'Skip vs. "come back to"',
  small: "Notes and the small stuff",
  else: "Anything else",
} as const
type GroupId = keyof typeof GROUPS

function loadAnswers(): Answers {
  try {
    return JSON.parse(localStorage.getItem(ANSWERS_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function emailBody(answers: Answers): string {
  const parts = [answers.name ? `From: ${answers.name}` : ""]
  for (const [id, title] of Object.entries(GROUPS)) {
    parts.push(`${title}\n${answers[id]?.trim() || "(no answer)"}`)
  }
  return parts.filter(Boolean).join("\n\n")
}

const KEYS: [ReactNode, string][] = [
  [<Kbd key="t">Tab</Kbd>, "Next stop (⇧Tab goes back): each bone's header, its Condition chips, then its fields. The last Tab lands on Continue."],
  [<Kbd key="d">0–9</Kbd>, "Score a Morphological trait by its number, and move on"],
  [<KbdGroup key="a"><Kbd>←</Kbd><Kbd>→</Kbd></KbdGroup>, "Move between a trait's states; the reference drawing follows. Enter picks the one you're on."],
  [<Kbd key="e">Enter</Kbd>, "Keep a measurement and move on; on Continue, go to the next section"],
  [<Kbd key="b">⌫</Kbd>, "Clear a Morphological score (or click the chosen state again). For a measurement, delete the number."],
  [<Kbd key="m">−</Kbd>, "Skip the field, even if it has a value (Undo appears); − again un-Skips. On a bone's header, − skips the bone's blanks."],
  [<KbdGroup key="f"><Kbd>⌥</Kbd><Kbd>F</Kbd></KbdGroup>, "Mark the field to come back to; press again to unmark. Skip and come back to can both be used."],
  [<Kbd key="q">R</Kbd>, "Show or hide the reference panel (? works too). It stays as you set it while you move between fields."],
  [<Kbd key="n">N</Kbd>, "Add or edit a note on the field. ⌘↵ saves; Esc cancels."],
  [<KbdGroup key="s"><Kbd>⌃</Kbd><Kbd>⌥</Kbd><Kbd>↓</Kbd></KbdGroup>, "Next section from anywhere (↑ for the previous one)"],
  [<Kbd key="f6">F6</Kbd>, "Jump to the Regions list on the left; arrows move, Enter opens, Esc comes back"],
]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Response({ id, answers, onChange }: { id: GroupId; answers: Answers; onChange: (id: string, v: string) => void }) {
  return (
    <Textarea
      aria-label={`Your thoughts: ${GROUPS[id]}`}
      rows={4}
      placeholder="Your thoughts…"
      value={answers[id] ?? ""}
      onChange={(e) => onChange(id, e.target.value)}
    />
  )
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((q, i) => (
        <li key={i}>{q}</li>
      ))}
    </ul>
  )
}

export function Guide() {
  const events = useSyncExternalStore(subscribeEvents, getEvents)
  const [answers, setAnswers] = useState<Answers>(loadAnswers)
  const [copied, setCopied] = useState<"answers" | "log" | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers))
    } catch {
      // Storage can be unavailable; the boxes still work until the tab closes.
    }
  }, [answers])

  const set = (id: string, v: string) => setAnswers((a) => ({ ...a, [id]: v }))
  const answered = Object.keys(GROUPS).some((id) => answers[id]?.trim())
  const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    `MOSAIC prototype feedback${answers.name ? ` from ${answers.name}` : ""}`,
  )}&body=${encodeURIComponent(emailBody(answers))}`
  const copy = (what: "answers" | "log") => {
    navigator.clipboard.writeText(
      what === "answers" ? emailBody(answers) : JSON.stringify({ copiedAt: new Date().toISOString(), events }, null, 2),
    )
    setCopied(what)
  }
  const key = (k: string) => <code className="rounded bg-muted px-1 font-mono text-xs">{k}</code>

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-4">
        <a className="text-sm text-muted-foreground" href="#/">
          ← Back to the prototype
        </a>
        <Badge variant="outline" className="w-fit">
          <FlaskConical /> Prototype for testing
        </Badge>
        <h1 className="text-3xl font-semibold">Trying out MOSAIC data entry</h1>
        <p>
          Thanks for taking a look. This is an early, clickable version of the data-entry screens. It isn't the real
          app: nothing is saved anywhere, the case is made up, and some buttons are just for show (Dashboard, Download
          progress, Import data). We want your honest first impressions.
        </p>
        <p>
          <strong>What to do:</strong> Pick a region, try entering data the way you normally would, and notice what
          feels easy and what gets in your way.
        </p>
        <div className="flex flex-col gap-2">
          <p>
            <strong>A suggested path,</strong> if you'd like one:
          </p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Score a couple of Morphological bone groups.</li>
            <li>Hit a measurement you can't take (pretend the bone is damaged) and one you're not sure about.</li>
            <li>Leave a note on a field.</li>
            <li>Jump to a Metric section and enter a few values.</li>
            <li>Click Analyze and see what it tells you.</li>
          </ol>
        </div>
        <p>
          Once you are done trying it out and getting your first impressions, go to the bottom right corner (
          <strong>Tester guide</strong>) to bring this guide back up and think about the questions below. Anything you
          type here is kept in this browser until you send it.
        </p>
        <Button asChild className="w-fit">
          <a href="#/">
            Go to the prototype <ArrowRight data-icon="inline-end" />
          </a>
        </Button>
      </header>

      <Separator />

      <section className="flex flex-col gap-8">
        <h2 className="text-xl font-semibold">What we'd love to hear about</h2>

        <Group title={GROUPS.around}>
          <p>We want MOSAIC to be fast for people who score a lot of cases, and that often means the keyboard.</p>
          <Bullets
            items={[
              "Could you work through a section without reaching for the mouse? Where did you have to stop and click?",
              "Did Tab go where you expected, from the bone's header to its Conditions to its fields?",
              <>
                Were the shortcuts worth learning? Number keys score, {key("-")} skips, {key("⌥F")} marks a field to
                come back to, {key("N")} adds a note, {key("R")} shows the reference. Were any confusing or easy to hit
                by accident?
              </>,
              "If you used the mouse, was everything you needed easy to reach?",
            ]}
          />
          <Response id="around" answers={answers} onChange={set} />
        </Group>

        <Group title={GROUPS.layout}>
          <Bullets
            items={[
              "When you looked for something, was it where you looked first? Think of moving between regions, the case number, Analyze, and adding a note.",
              "Did anything feel crowded, or too spread out?",
              "The left rail lists the regions. Did it help you keep track of where you were and what was left?",
            ]}
          />
          <Response id="layout" answers={answers} onChange={set} />
        </Group>

        <Group title={GROUPS.reference}>
          <p>
            We're still deciding where the drawings and definitions should go, and this is the part we most want
            opinions on. The panel starts closed; press <strong>Show reference</strong> (or {key("R")}) to bring it up.
          </p>
          <Bullets
            items={["Did you find it on your own?", "Once it was open, did you actually use it?", "Did it help, or get in the way?"]}
          />
          <p>
            If you have a few extra minutes, open <strong>Test mode</strong> (the small strip at the very bottom) and
            try the other placements:
          </p>
          <Bullets
            items={[
              <>
                <strong>A:</strong> beside the fields.
              </>,
              <>
                <strong>B:</strong> along the bottom.
              </>,
              <>
                <strong>C:</strong> right under the field you're on.
              </>,
            ]}
          />
          <p>Which would you want to work with every day? Even a quick "C felt cramped" is useful.</p>
          <Response id="reference" answers={answers} onChange={set} />
        </Group>

        <Group title={GROUPS.skip}>
          <p>These are two different things, on purpose:</p>
          <Bullets
            items={[
              <>
                <strong>Skip</strong> means "this can't be recorded for this skeleton," for example because the bone is
                missing or too damaged. Skipping records that the value is absent deliberately, not forgotten. That way
                the Analysis (and anyone reading the case later) can tell "not observable" apart from "nobody got to
                it."
              </>,
              <>
                <strong>Come back to</strong> (the flag) means "I can record this, just not right now," or "I want a
                second look." Flagged fields are counted on the Analyze button so they don't slip through.
              </>,
            ]}
          />
          <p>
            The thinking behind this: <strong>record everything that's available, and say clearly what isn't.</strong>{" "}
            We'd rather a case have a few honest skips than a lot of blank fields with no explanation.
          </p>
          <Bullets
            items={[
              "Did that distinction make sense while you were working, or did the two blur together?",
              "Was there a moment you weren't sure which one to use?",
              "Is there a situation that fits neither one?",
              "You can skip and flag the same field. Did that ever come up?",
            ]}
          />
          <Response id="skip" answers={answers} onChange={set} />
        </Group>

        <Group title={GROUPS.small}>
          <Bullets
            items={[
              "Did adding a note feel natural? Could you tell afterwards which fields had notes?",
              "Did the intro card on the first field help, or did you just close it?",
              "Was any wording unclear: labels, button names, messages?",
            ]}
          />
          <Response id="small" answers={answers} onChange={set} />
        </Group>

        <Group title={GROUPS.else}>
          <p>
            If something surprised you, annoyed you, or made you think "I'd never do it that way," tell us. That's
            exactly what we're looking for.
          </p>
          <Response id="else" answers={answers} onChange={set} />
        </Group>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border p-5 text-sm">
        <h2 className="text-lg font-semibold">Send your feedback</h2>
        <p className="text-muted-foreground">
          This opens an email with your answers in your mail app, ready to send. Screenshots are welcome: attach them
          to the email.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="font-medium">Your name (optional)</span>
          <Input className="max-w-xs" value={answers.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild aria-disabled={!answered} className={answered ? "" : "pointer-events-none opacity-50"}>
            <a href={mailto} tabIndex={answered ? undefined : -1}>
              <Mail /> Submit by email
            </a>
          </Button>
          <Button variant="outline" onClick={() => copy("answers")} disabled={!answered}>
            {copied === "answers" ? <Check /> : <ClipboardCopy />} {copied === "answers" ? "Copied" : "Copy answers"}
          </Button>
          {!answered && <span className="text-muted-foreground">Answer at least one group to send.</span>}
        </div>
        <p className="text-muted-foreground">
          If no email opens, copy your answers and paste them into a message instead. Optionally,{" "}
          <button type="button" className="underline hover:text-foreground" onClick={() => copy("log")}>
            {copied === "log" ? "copied" : "copy your session log"}
          </button>{" "}
          ({events.length} entries) and paste it in too: it has only keys, clicks and timings, no values you typed.
        </p>
      </section>

      <Separator />

      <section className="flex flex-col gap-2 text-sm">
        <h2 className="text-lg font-semibold">Good to know</h2>
        <p className="font-medium">Not built yet, so don't worry about these:</p>
        <Bullets
          items={[
            "Choosing which bones are present (Inventory)",
            "A guided tour",
            "Real saving and importing",
            "What comes after Analysis",
          ]}
        />
        <p className="mt-2 font-medium">Also:</p>
        <Bullets
          items={[
            "Use a laptop or desktop with a keyboard. Touch screens aren't supported yet.",
            <>
              The data is made up. <strong>Don't enter real case information.</strong> Nothing you enter in the
              prototype leaves your browser.
            </>,
            "Reloading the page starts the Workup again. That's a limit of the prototype; the real app saves as you go.",
            "Out-of-range values show a warning you can acknowledge. That's intended: warnings never block you.",
          ]}
        />
      </section>

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
    </main>
  )
}

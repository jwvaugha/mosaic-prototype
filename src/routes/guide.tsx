import { ArrowRight, Check, ClipboardCopy, FlaskConical, Keyboard, Mail, MousePointerClick } from "lucide-react"
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Textarea } from "@/components/ui/textarea"
import { getEvents, subscribeEvents } from "@/lib/event-log"
import { FLAG_KEYS } from "@/lib/keys"
import { cn } from "@/lib/utils"

// Design updates: the prototype's landing page (the bare link opens it, as
// does Help › Design updates). Since 2026-11-09 it replaces the round 1
// tester guide, which is archived outside the repo (MOSAIC/Feedback/Round 1
// tester guide). It lists changes newest first, each with what changed, why,
// and a link to try it; testers can leave a note under any update and send
// them all by email. The keys stay in view in a column to the side.
//
// To add an update: put a new entry at the top of UPDATES.

const FEEDBACK_EMAIL = "jwvaugha@illinois.edu"
const NOTES_KEY = "mosaic-proto:update-notes"

type Notes = Record<string, string>

// A link into the prototype with a given setup. The query sets the opening
// section and the reference panel; `#/` is the prototype itself.
const tryLink = (q: Record<string, string>) => `?${new URLSearchParams({ dim: "0", ...q })}#/`

type Change = { title: ReactNode; body: ReactNode; tryIt?: { label: string; href: string; how?: ReactNode } }
type Update = {
  id: string
  date: string // ISO
  title: string
  intro: ReactNode
  changes: Change[]
  after?: ReactNode
  // Offer a notes box (not on the round 1 summary).
  notes?: boolean
}

const k = (s: string) => <Kbd>{s}</Kbd>

const UPDATES: Update[] = [
  {
    id: "2026-11-10-panel-flags-rail",
    date: "2026-11-10",
    title: "A wider reference panel, brighter flags",
    intro: <>More changes from your first round of feedback, mostly to the reference panel beside the fields.</>,
    notes: true,
    changes: [
      {
        title: <>Drag the reference panel wider</>,
        body: (
          <>
            Several of you found the drawings small beside the fields. Drag the panel's left edge to make it as wide as you
            like, and the drawings and photos grow with it. It keeps that width the next time you open the prototype.
            Double-click the edge to go back to the usual width.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph", ref: "A", refon: "1" }),
          how: <>Point at the panel's left edge until the cursor changes, then drag it to the left.</>,
        },
      },
      {
        title: <>Clicking in the panel no longer stops the keys</>,
        body: (
          <>
            After a click in the panel (a drawing, its text, or its close button), the keys stopped working until you
            clicked a field again. Now the field you were on keeps the keys, so you can click a drawing to score it and
            carry on by keyboard.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph", ref: "A", refon: "1" }),
          how: (
            <>
              Click a drawing in the panel, then press {k("↓")} to go to the next trait.
            </>
          ),
        },
      },
      {
        title: <>Fields to come back to stand out</>,
        body: (
          <>
            A marked field now shows a yellow "Come back" label, and its count beside the Region and on Analyze is yellow too.
            The yellow is a highlighter, not a warning: out-of-range values keep their amber triangle. The Skip, Come back
            and note icons on each row are also larger.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph" }),
          how: (
            <>
              Press {k(FLAG_KEYS)} on a trait.
            </>
          ),
        },
      },
      {
        title: <>The Regions list keeps its header</>,
        body: (
          <>
            The button that collapses the Regions list, and the overall progress, now stay at the top while the list
            scrolls, so you don't have to scroll back up to reach them.
          </>
        ),
      },
    ],
  },
  {
    id: "2026-11-09-more-photos",
    date: "2026-11-09",
    title: "Twice as many reference photos",
    intro: <>The first set of photos came from only half of the shared folder. The panel now has the other half too.</>,
    changes: [
      {
        title: <>The rest of the photo folder</>,
        body: (
          <>
            There are now about 1,300 photos in all. Most MMS and dental states now show several examples to step through, and a few TA3
            traits have photos for the first time, among them R3–R10 shingling, the superior posterior iliac exostoses
            and the trochanteric exostoses.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph", ref: "A", refon: "1" }),
          how: <>Switch the panel to Photos and step through the examples with ‹ ›.</>,
        },
      },
    ],
  },
  {
    id: "2026-11-09-feedback",
    date: "2026-11-09",
    title: "Quick fixes from your first round of feedback",
    intro: (
      <>
        Eight of you sent detailed notes. These are the changes we could make straight away; the bigger questions are
        listed at the end.
      </>
    ),
    notes: true,
    changes: [
      {
        title: (
          <>
            Go back up with {k("↑")}, down with {k("↓")}
          </>
        ),
        body: (
          <>
            Several of you couldn't get back to a field without the mouse. The up and down arrows now move to the previous
            or next field, including ones you've Skipped, so you can return and un-Skip by keyboard. Tab still passes over
            Skipped fields and stops at each bone's header.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph" }),
          how: (
            <>
              Skip a trait with {k("−")}, press {k("↑")} to go back to it, then {k("−")} again to un-Skip.
            </>
          ),
        },
      },
      {
        title: <>Enter scores the state you're on</>,
        body: (
          <>
            When you arrive on a trait you're on its first state, outlined. {k("←")} {k("→")} move between states, and{" "}
            {k("Enter")} (or a number key) scores the one you're on and moves to the next trait. To pass a trait by
            without scoring it, use {k("Tab")} or {k("↓")}.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph" }),
          how: (
            <>
              Press {k("→")} twice, then {k("Enter")}.
            </>
          ),
        },
      },
      {
        title: (
          <>
            "Come back to" is {k(FLAG_KEYS)}, spelled out, and moves on
          </>
        ),
        body: (
          <>
            The shortcut used to show only the ⌥ symbol. It now reads "{FLAG_KEYS}". Marking a field to come back to also
            moves to the next one, as Skip does. Pressing it again on a marked field unmarks it.
          </>
        ),
      },
      {
        title: <>Skipped fields count as done</>,
        body: (
          <>
            Progress (in the Regions list, the section header and each bone) now reads "12 of 20 done", counting Skips,
            so skipping what isn't there no longer makes a section look unfinished.
          </>
        ),
      },
      {
        title: <>Sections open at the top</>,
        body: <>Moving to the next section used to open it partway down the page. It now starts at the top.</>,
      },
      {
        title: <>Bring the intro card back from Help</>,
        body: (
          <>
            The card that explains scoring, Skip and come back to was easy to close and hard to find again.{" "}
            <strong>Help › How scoring works</strong> in the header shows it again. Its wording is clearer too: "Score a
            trait by clicking a score or typing its number."
          </>
        ),
      },
      {
        title: <>Small fixes</>,
        body: (
          <>
            Trait codes that only repeat the name are hidden ("Lambda (2) Lambda" is now "Lambda (2)"). "Tardrop" is now
            "teardrop" in Nasal aperture shape.
          </>
        ),
      },
    ],
    after: (
      <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-4 text-sm leading-6">
        <p className="font-medium">Still to talk through together</p>
        <p className="text-muted-foreground">
          Where the reference panel goes and whether it starts open; a better name for Skip; how cranial traits and
          regions are grouped (Sex traits, Thorax, sacrum, innominate); condition notes per region; notes for a whole
          bone; tablets. We'll bring these to the next meeting.
        </p>
      </div>
    ),
  },
  {
    id: "2026-11-09-photos",
    date: "2026-11-09",
    title: "Photos in the reference panel",
    intro: <>The reference panel now shows the photographs you sent, alongside the drawings.</>,
    notes: true,
    changes: [
      {
        title: <>Drawings or Photos</>,
        body: (
          <>
            A toggle at the top of the panel switches between them, and stays as you set it from field to field. Photos
            cover the MMS cranial traits, the TA3 age traits, auricular surface elevation, composite arc, ilium shape and
            the FoRDent dental traits.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph", ref: "A", refon: "1" }),
          how: <>Switch the panel to Photos, then move between traits.</>,
        },
      },
      {
        title: <>Several examples of one state</>,
        body: (
          <>
            Where there's more than one photo of a state, the image shows ‹ 1 / 3 › to step through them (↑ ↓ in the
            enlarged view). Dental files labelled 4.1 and 4.2 are now examples of state 4, not separate scores.
          </>
        ),
        tryIt: {
          label: "Try it in Dentition · Morphological",
          href: tryLink({ start: "dentition-morph", ref: "A", refon: "1" }),
        },
      },
    ],
  },
  {
    id: "2026-10-30-viewer",
    date: "2026-10-30",
    title: "Choosing from the reference drawings",
    intro: <>Comparing states in the reference panel, and scoring from it.</>,
    notes: true,
    changes: [
      {
        title: <>Click a drawing to choose it, again to clear it</>,
        body: <>In every layout, clicking the chosen state's drawing again clears the score, as the row's buttons do.</>,
      },
      {
        title: <>An enlarged viewer that compares states</>,
        body: (
          <>
            Enlarging a trait's drawing opens a viewer with every state as a captioned thumbnail. {k("←")} {k("→")}{" "}
            compare; <strong>Choose</strong> (or {k("Enter")}) scores the one shown.
          </>
        ),
        tryIt: {
          label: "Try it in Cranium · Morphological",
          href: tryLink({ start: "cranium-morph", ref: "A", refon: "1" }),
          how: <>Click the large drawing in the panel to enlarge it.</>,
        },
      },
    ],
  },
  {
    id: "2026-10-29-round-1",
    date: "2026-10-29",
    title: "Round 1: first look",
    intro: (
      <>
        The first version you tried. We asked about getting around by keyboard, the layout, where the reference panel
        should go (beside the fields, along the bottom, or under the field), Skip vs. come back to, and notes. Thank you
        for the feedback.
      </>
    ),
    changes: [
      {
        title: <>What we heard, briefly</>,
        body: (
          <ul className="list-disc space-y-1 pl-5">
            <li>The flow made sense, and nobody got stuck.</li>
            <li>Most of you preferred the reference panel beside the fields; nobody chose the bottom.</li>
            <li>Skip and come back to were clear as ideas, but "Skip" is the wrong word.</li>
            <li>Going back by keyboard and the come-back shortcut were hard to find.</li>
            <li>Several suggestions about how traits and regions are grouped.</li>
          </ul>
        ),
      },
    ],
  },
]

const KEYS: { k: ReactNode; d: string; isNew?: boolean }[] = [
  { k: <Kbd>Tab</Kbd>, d: "Next stop (⇧Tab goes back): each bone's header, its Condition chips, then its fields; the last is Continue" },
  { k: <KbdGroup><Kbd>↑</Kbd><Kbd>↓</Kbd></KbdGroup>, d: "Previous / next field, Skipped ones included", isNew: true },
  { k: <Kbd>0–9</Kbd>, d: "Score a trait by its number and move on" },
  { k: <KbdGroup><Kbd>←</Kbd><Kbd>→</Kbd></KbdGroup>, d: "Move between a trait's states (the reference follows)" },
  { k: <Kbd>Enter</Kbd>, d: "Score the state you're on and move on; keep a measurement and move on", isNew: true },
  { k: <Kbd>Space</Kbd>, d: "Mark the state you're on, or tick a Condition" },
  { k: <Kbd>⌫</Kbd>, d: "Clear a trait's score" },
  { k: <Kbd>−</Kbd>, d: "Skip the field (again to un-Skip); on a bone's header, Skip its blanks" },
  { k: <Kbd>{FLAG_KEYS}</Kbd>, d: "Mark to come back to and move on (again to unmark)", isNew: true },
  { k: <Kbd>R</Kbd>, d: "Show or hide the reference panel" },
  { k: <Kbd>N</Kbd>, d: "Add or edit a note (⌘↵ saves, Esc cancels)" },
  { k: <KbdGroup><Kbd>⌃</Kbd><Kbd>⌥</Kbd><Kbd>↓</Kbd></KbdGroup>, d: "Next section from anywhere (↑ for the previous)" },
  { k: <Kbd>F6</Kbd>, d: "Jump to the Regions list; Esc comes back" },
]

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

function loadNotes(): Notes {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function emailBody(notes: Notes): string {
  const parts = [notes.name ? `From: ${notes.name}` : ""]
  for (const u of UPDATES) {
    const note = notes[u.id]?.trim()
    if (note) parts.push(`${u.title} (${u.date})\n${note}`)
  }
  if (notes.general?.trim()) parts.push(`Anything else\n${notes.general.trim()}`)
  return parts.filter(Boolean).join("\n\n")
}

// Spacing follows the hierarchy, so things that belong together sit closer
// than the things they belong to (4 px steps):
//   updates                     64   (padding, so the timeline line runs on)
//   an update's blocks          32   header / changes / still-to-discuss / notes
//   changes within an update    24
//   a change: text → Try it     12
//   a change: title → body       4   (title → intro 8 in the update header)
function UpdateEntry({ u, latest, notes, onNote }: { u: Update; latest: boolean; notes: Notes; onNote: (id: string, v: string) => void }) {
  return (
    <article id={`update-${u.id}`} className="relative flex flex-col gap-8 border-l-2 pb-16 pl-6 last:pb-2">
      <span
        aria-hidden
        className={cn("absolute top-1.5 -left-[7px] size-3 rounded-full border-2 bg-background", latest ? "border-primary bg-primary" : "border-border")}
      />
      <header className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={u.date}>{formatDate(u.date)}</time>
            {latest && <Badge className="h-5">Latest</Badge>}
          </div>
          <h2 className="text-xl font-semibold">{u.title}</h2>
        </div>
        <p className="text-sm leading-6">{u.intro}</p>
      </header>
      <div className="flex flex-col gap-6">
        {u.changes.map((c, i) => (
          <section key={i} className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <h3 className="flex flex-wrap items-center gap-1.5 text-base font-medium">{c.title}</h3>
              <div className="leading-6 text-muted-foreground">{c.body}</div>
            </div>
            {c.tryIt && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Button asChild size="sm" variant="outline" className="w-fit">
                  <a href={c.tryIt.href}>
                    {c.tryIt.label} <ArrowRight data-icon="inline-end" />
                  </a>
                </Button>
                {c.tryIt.how && <span className="text-muted-foreground">{c.tryIt.how}</span>}
              </div>
            )}
          </section>
        ))}
      </div>
      {u.after}
      {u.notes && (
        <Textarea
          aria-label={`Your thoughts on: ${u.title}`}
          rows={3}
          placeholder="Tried it? Any thoughts on this update…"
          value={notes[u.id] ?? ""}
          onChange={(e) => onNote(u.id, e.target.value)}
        />
      )}
    </article>
  )
}

export function Guide() {
  const events = useSyncExternalStore(subscribeEvents, getEvents)
  const [notes, setNotes] = useState<Notes>(loadNotes)
  const [copied, setCopied] = useState<"notes" | "log" | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
    } catch {
      // Storage can be unavailable; the boxes still work until the tab closes.
    }
  }, [notes])

  const set = (id: string, v: string) => setNotes((n) => ({ ...n, [id]: v }))
  const written = [...UPDATES.map((u) => u.id), "general"].some((id) => notes[id]?.trim())
  const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    `MOSAIC design updates: notes${notes.name ? ` from ${notes.name}` : ""}`,
  )}&body=${encodeURIComponent(emailBody(notes))}`
  const copy = (what: "notes" | "log") => {
    navigator.clipboard.writeText(
      what === "notes" ? emailBody(notes) : JSON.stringify({ copiedAt: new Date().toISOString(), events }, null, 2),
    )
    setCopied(what)
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
      <main className="flex min-w-0 flex-col gap-16">
        <header className="flex flex-col gap-4">
          <Badge variant="outline" className="w-fit">
            <FlaskConical /> Prototype for testing
          </Badge>
          <h1 className="text-3xl font-semibold">MOSAIC data entry: design updates</h1>
          <p>
            What's changed in the prototype, newest first. Each update says what changed and why, with a link that opens
            the prototype where you can try it. Trying them is optional. If you do, a line in the box under an update
            helps, and you can send them all at the bottom of the page.
          </p>
          <p className="text-sm text-muted-foreground">
            It's still an early, clickable prototype: nothing is saved, the case is made up, and some buttons are just for
            show. The keys are listed{" "}
            <span className="lg:hidden">at the end of the page</span>
            <span className="hidden lg:inline">on the right</span>.
          </p>
          <Button asChild className="w-fit">
            <a href="#/">
              Go to the prototype <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </header>

        <div className="flex flex-col">
          {UPDATES.map((u, i) => (
            <UpdateEntry key={u.id} u={u} latest={i === 0} notes={notes} onNote={set} />
          ))}
        </div>

        <section className="flex flex-col gap-3 rounded-xl border p-5 text-sm">
          <h2 className="text-lg font-semibold">Send your notes</h2>
          <label className="flex flex-col gap-1.5">
            <span className="font-medium">Anything else</span>
            <Textarea
              aria-label="Anything else"
              rows={3}
              placeholder="Something that isn't about a particular update…"
              value={notes.general ?? ""}
              onChange={(e) => set("general", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-medium">Your name (optional)</span>
            <Input className="max-w-xs" value={notes.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </label>
          <p className="text-muted-foreground">
            This opens an email in your mail app with every note you've written on this page. Notes are kept in this
            browser until you send them. Screenshots are welcome: attach them to the email.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild aria-disabled={!written} className={written ? "" : "pointer-events-none opacity-50"}>
              <a href={mailto} tabIndex={written ? undefined : -1}>
                <Mail /> Send by email
              </a>
            </Button>
            <Button variant="outline" onClick={() => copy("notes")} disabled={!written}>
              {copied === "notes" ? <Check /> : <ClipboardCopy />} {copied === "notes" ? "Copied" : "Copy notes"}
            </Button>
            {!written && <span className="text-muted-foreground">Write a note above to send it.</span>}
          </div>
          <p className="text-muted-foreground">
            If no email opens, copy your notes into a message instead. Optionally,{" "}
            <button type="button" className="underline hover:text-foreground" onClick={() => copy("log")}>
              {copied === "log" ? "copied" : "copy your session log"}
            </button>{" "}
            ({events.length} entries): it has only keys, clicks and timings, no values you typed.
          </p>
        </section>

        <section className="flex flex-col gap-2 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">Good to know</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Not built yet: choosing which bones are present (Inventory), a guided tour, real saving and importing, and what comes after Analysis.</li>
            <li>Use a laptop or desktop with a keyboard; touch screens aren't supported yet.</li>
            <li>
              The data is made up. <strong className="text-foreground">Don't enter real case information.</strong> Nothing
              you enter leaves your browser.
            </li>
            <li>Reloading the page starts the Workup again; the real app saves as you go.</li>
            <li>
              To compare reference panel layouts, open <strong className="text-foreground">Test mode</strong> from the
              strip at the very bottom of the prototype.
            </li>
          </ul>
        </section>
      </main>

      <aside aria-labelledby="keys-heading" className="lg:sticky lg:top-8 lg:max-h-[calc(100svh-4rem)] lg:self-start lg:overflow-y-auto">
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
          <h2 id="keys-heading" className="flex items-center gap-2 text-base font-semibold">
            <Keyboard className="size-4" /> Keys
          </h2>
          {/* Key on the left, what it does on the right; recently changed
              keys get a dot (legend below). */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[13px] leading-snug">
            {KEYS.map((row, i) => (
              <div key={i} className="contents">
                <dt className="relative flex items-start justify-end pt-px">
                  {row.k}
                  {row.isNew && (
                    <span aria-label="changed" className="absolute -top-0.5 -right-1 size-1.5 rounded-full bg-primary" />
                  )}
                </dt>
                <dd className="text-muted-foreground">{row.d}</dd>
              </div>
            ))}
          </dl>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" /> Changed on November 9
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <MousePointerClick className="mt-px size-3.5 shrink-0" /> On a PC, ⌃ is Ctrl and ⌥ is Alt. Everything also
            works with the mouse.
          </p>
        </div>
      </aside>
    </div>
  )
}

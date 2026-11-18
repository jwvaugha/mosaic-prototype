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
// and how to try it (a link only where it lives in one section); testers can leave a note under any update and send
// them all by email. The keys stay in view in a column to the side.
//
// To add an update: put a new entry at the top of UPDATES.

const FEEDBACK_EMAIL = "jwvaugha@illinois.edu"
const NOTES_KEY = "mosaic-proto:update-notes"

type Notes = Record<string, string>

// A link into the prototype with a given setup. The query sets the opening
// section and the reference panel; `#/` is the prototype itself.
// Pins the decided incompletion policy, so a policy switched in Test mode
// doesn't follow testers into the updates they try.
const tryLink = (q: Record<string, string>) => `?${new URLSearchParams({ dim: "0", inc: "skip-and-flag", ...q })}#/`

// `how` says how to try a change. `goTo` adds a button only when the change
// lives in one particular section; changes that show up on every field, or in
// any section, get just the `how` line.
type Change = { title: ReactNode; body: ReactNode; how?: ReactNode; goTo?: { label: string; href: string } }
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
    id: "2026-11-18-all-figures",
    date: "2026-11-18",
    title: "Every reference figure, on every field",
    intro: (
      <>
        The reference panel now shows the measurement figures and method drawings that used to be grey boxes, so you
        can judge it as it will really work.
      </>
    ),
    notes: true,
    changes: [
      {
        title: <>Measurement figures for Metric fields</>,
        body: (
          <>
            Each cranial, mandible and postcranial measurement now has its own figure with the measurement marked,
            except for 17 cranial measurements still waiting for one. Tell us if a figure marks the wrong measurement
            or is hard to read at the panel's size.
          </>
        ),
        how: <>Open any Metric section and focus a measurement with the reference panel on.</>,
      },
      {
        title: <>Drawings for the cranial and pelvic sex traits</>,
        body: (
          <>
            Glabella, mastoid process, nuchal crest and supraorbital margin, and the ventral arc, subpubic contour and
            medial aspect of the ischiopubic ramus, now show their drawings for each score.
          </>
        ),
        how: <>In Cranium · Morphological (Vault and palate) or Pelvis · Morphological (Pubis), focus one of these traits.</>,
      },
      {
        title: <>Cusp number on the lower second and third molars</>,
        body: <>Score 3 (only three cusps) now has its description, and score 5 has a new drawing.</>,
        goTo: { label: "Try it in Dentition · Morphological", href: tryLink({ start: "dentition-morph", ref: "A", refon: "1" }) },
      },
    ],
  },
  {
    id: "2026-11-18-regions-by-location",
    date: "2026-11-18",
    title: "Traits grouped by where they are",
    intro: (
      <>
        Traits are now grouped by where they sit on the skeleton, not by the estimate they're traditionally used for,
        so that no group suggests a trait only matters for sex or age.
      </>
    ),
    notes: true,
    changes: [
      {
        title: <>No more "Sex traits" group on the cranium</>,
        body: (
          <>
            Glabella, mastoid process and nuchal crest are now under Vault and palate, and the supraorbital margin is
            under Zygomatic and orbit.
          </>
        ),
        goTo: { label: "Try it in Cranium · Morphological", href: tryLink({ start: "cranium-morph", ref: "A", refon: "1" }) },
      },
      {
        title: <>"Innominate," and the pelvic traits by location</>,
        body: (
          <>
            "Os coxae" is now "Innominate." In Pelvis · Morphological, ilium shape, greater sciatic notch and composite
            arc are under Ilium, auricular surface height is under Auricular surface, and the ventral arc, subpubic
            contour and medial aspect of the ischiopubic ramus are under Pubis, with the pubic symphysis. The sacrum
            stays in Pelvis for now. If you'd look for it elsewhere, please say where.
          </>
        ),
        goTo: { label: "Try it in Pelvis · Morphological", href: tryLink({ start: "pelvis-morph", ref: "A", refon: "1" }) },
      },
      {
        title: <>Thorax holds the vertebrae and ribs; "Upper limb"</>,
        body: (
          <>
            The vertebrae are now in Thorax, ahead of the sternum and ribs, so there's no separate Vertebrae Region.
            "Shoulder & upper limb" is now "Upper limb," which still includes the clavicle and scapula.
          </>
        ),
        how: <>Look at the Regions list on the left.</>,
      },
    ],
  },
  {
    id: "2026-11-18-dental-descriptions",
    date: "2026-11-18",
    title: "Descriptions for the dental traits",
    intro: <>The dental traits now say what each score means.</>,
    notes: true,
    changes: [
      {
        title: <>Every dental state is described</>,
        body: (
          <>
            The descriptions from FoRDent are now in the reference panel and the enlarged view, for all but one state of
            the Dentition · Morphological traits. Before, almost every state read "No description yet". Third molars show
            the second molar's descriptions, since they're scored on the same scale. If a description reads wrongly, or
            doesn't match its drawing, please say which trait and state.
          </>
        ),
        goTo: { label: "Try it in Dentition · Morphological", href: tryLink({ start: "dentition-morph", ref: "A", refon: "1" }) },
      },
      {
        title: <>{k("E")} closes the enlarged view too</>,
        body: <>{k("E")} now closes the enlarged view as well as opening it, so you can check a state and carry on.</>,
        how: <>On a trait, press {k("E")} twice.</>,
      },
      {
        title: <>Drawings and Photos appear only where there's a choice</>,
        body: (
          <>
            The Drawings / Photos buttons now show only on traits that have both. Where there are only drawings, or only
            photos, the panel simply shows them.
          </>
        ),
      },
    ],
  },
  {
    id: "2026-11-18-drawings-photos-keys",
    date: "2026-11-18",
    title: "Reference images from the keyboard, and a clearer enlarged view",
    intro: (
      <>
        You can now reach the reference images without the mouse, and the enlarged view of a trait's states is easier
        to read.
      </>
    ),
    notes: true,
    changes: [
      {
        title: (
          <>
            {k("D")} for drawings, {k("P")} for photos
          </>
        ),
        body: (
          <>
            On any trait with reference images, {k("D")} shows the drawings and {k("P")} the photos, in the panel and in the
            enlarged view. If the panel is closed, either key opens it. The Drawings and Photos buttons now show their keys.
          </>
        ),
        how: <>On a Morphological trait, press {k("P")}, then {k("D")}.</>,
      },
      {
        title: <>{k("E")} opens the enlarged view</>,
        body: (
          <>
            On a trait, {k("E")} opens the large view of its states, at the state you're on. On a measurement, it enlarges
            the drawing. It works with the panel closed too, and {k("Esc")} takes you back to the field. The enlarge button
            on the panel's image shows the key.
          </>
        ),
        how: (
          <>
            On a Morphological trait, press {k("→")} to move to a state, then {k("E")}.
          </>
        ),
      },
      {
        title: <>The enlarged view, reorganised</>,
        body: (
          <>
            The top now names only the trait and its section, so it stays put while you compare. Under the large image is
            the state on screen, with its full description, marked <em>Scored</em> if it's the one you recorded. Your
            current score sits at the bottom beside the Choose button. Drawings and Photos have moved onto the image, and
            each key is shown on the control it works ({k("←")} {k("→")} on the arrows, {k("↑")} {k("↓")} on a
            state's examples).
          </>
        ),
        how: <>Open any trait's enlarged view with {k("E")}.</>,
      },
    ],
  },
  {
    id: "2026-11-18-round-2-fixes",
    date: "2026-11-18",
    title: "Fixes from your second round of feedback",
    intro: <>Thank you for the notes on the last two updates. These fix the problems you ran into.</>,
    notes: true,
    changes: [
      {
        title: <>Come back to, and Alt F, are back</>,
        body: (
          <>
            If you tried another way of skipping in Test mode during the first round, the prototype kept using it, and that
            way has no "come back to". That's why {k("Alt")} {k("F")} seemed to do nothing for some of you. Everyone is now
            back on Skip and Come back to, and the links on this page always use it.
          </>
        ),
        how: <>Press {k("Alt")} {k("F")} on a trait: it turns yellow and you move to the next one.</>,
      },
      {
        title: <>Continue moves on at the first click</>,
        body: (
          <>
            In a long section such as Dentition · Morphological, clicking Continue took you back up to the last trait you
            were on instead of moving on. It now moves on, or asks about blank traits where it should.
          </>
        ),
        how: <>Score a few traits, scroll to the bottom and click Continue.</>,
        goTo: { label: "Try it in Dentition · Morphological", href: tryLink({ start: "dentition-morph", ref: "A", refon: "1" }) },
      },
      {
        title: <>Enter saves a note</>,
        body: (
          <>
            In the note box, {k("Enter")} now saves, and {k("⇧")} {k("Enter")} starts a new line. If the trait is already
            scored, you move on to the next one, so you can work through a section without the mouse.
          </>
        ),
        how: <>Score a trait, press {k("↑")} to go back to it, then {k("N")}, type a note and press {k("Enter")}.</>,
      },
      {
        title: <>Leaving an enlarged drawing or photo by keyboard</>,
        body: <>{k("Esc")} closes the enlarged view and returns you to the trait. The Close button now shows it.</>,
      },
      {
        title: <>Every state listed, and cleaner photo captions</>,
        body: (
          <>
            The reference panel now lists a trait's states one per line. Where we don't have a state's description yet,
            it says so, rather than the next state's description seeming to belong to it. This shows up most in Dentition
            · Morphological, where many descriptions are still to come. Photos no longer show the collection or place they
            came from, only which example you're on ("1 of 3").
          </>
        ),
        goTo: { label: "Try it in Dentition · Morphological", href: tryLink({ start: "dentition-morph", ref: "A", refon: "1" }) },
      },
    ],
  },
  {
    id: "2026-11-10-panel-flags-rail",
    date: "2026-11-10",
    title: "The reference panel: open from the start, wider, and where you want it",
    intro: <>More changes from your first round of feedback, mostly to the reference panel.</>,
    notes: true,
    changes: [
      {
        title: <>The reference panel starts open</>,
        body: (
          <>
            Several of you had to hunt for the Show reference button, and most of you kept the panel open once you found
            it. It now starts open, in the column beside the fields, which most of you preferred. {k("R")} or Hide
            reference still closes it.
          </>
        ),
      },
      {
        title: <>Choose where the panel goes</>,
        body: (
          <>
            The arrow beside Show/Hide reference opens a menu with two places: <em>Beside the fields</em>, a column that
            never moves, or <em>Under the field</em>, with larger drawings right below the field you're on. Choosing one
            opens the panel there, and the prototype remembers your choice. The strip along the bottom is no longer
            offered, since none of you picked it.
          </>
        ),
        how: <>Click the arrow beside Hide reference and choose Under the field.</>,
      },
      {
        title: <>Drag the reference panel wider</>,
        body: (
          <>
            Several of you found the drawings small beside the fields. Drag the grip on the panel's left edge to make it as
            wide as you like, and the drawings and photos grow with it. It keeps that width the next time you open the prototype.
            Double-click the edge to go back to the usual width.
          </>
        ),
        how: <>Drag the small grip halfway down the panel's left edge to the left.</>,
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
        how: (
          <>
            Click a drawing in the panel, then press {k("↓")} to go to the next trait.
          </>
        ),
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
        how: (
          <>
            Press {k(FLAG_KEYS)} on a trait.
          </>
        ),
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
      {
        title: <>A tidier section header in a narrow window</>,
        body: (
          <>
            When the window is too narrow for the buttons to sit beside the section's name, Import data and Show
            reference now move together onto their own line under the progress, instead of one of them breaking off
            on its own.
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
        how: <>Switch the panel to Photos and step through the examples with ‹ ›.</>,
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
        how: (
          <>
            Skip a trait with {k("−")}, press {k("↑")} to go back to it, then {k("−")} again to un-Skip.
          </>
        ),
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
        how: (
          <>
            Press {k("→")} twice, then {k("Enter")}.
          </>
        ),
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
        how: <>Switch the panel to Photos, then move between traits.</>,
      },
      {
        title: <>Several examples of one state</>,
        body: (
          <>
            Where there's more than one photo of a state, the image shows ‹ 1 / 3 › to step through them (↑ ↓ in the
            enlarged view). Dental files labelled 4.1 and 4.2 are now examples of state 4, not separate scores.
          </>
        ),
        goTo: { label: "Try it in Dentition · Morphological", href: tryLink({ start: "dentition-morph", ref: "A", refon: "1" }) },
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
        how: <>Click the large drawing in the panel to enlarge it.</>,
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
  { k: <KbdGroup><Kbd>↑</Kbd><Kbd>↓</Kbd></KbdGroup>, d: "Previous / next field, Skipped ones included" },
  { k: <Kbd>0–9</Kbd>, d: "Score a trait by its number and move on" },
  { k: <KbdGroup><Kbd>←</Kbd><Kbd>→</Kbd></KbdGroup>, d: "Move between a trait's states (the reference follows)" },
  { k: <Kbd>Enter</Kbd>, d: "Score the state you're on and move on; keep a measurement and move on" },
  { k: <Kbd>Space</Kbd>, d: "Mark the state you're on, or tick a Condition" },
  { k: <Kbd>⌫</Kbd>, d: "Clear a trait's score" },
  { k: <Kbd>−</Kbd>, d: "Skip the field (again to un-Skip); on a bone's header, Skip its blanks" },
  { k: <Kbd>{FLAG_KEYS}</Kbd>, d: "Mark to come back to and move on (again to unmark)" },
  { k: <Kbd>R</Kbd>, d: "Show or hide the reference panel" },
  { k: <KbdGroup><Kbd>D</Kbd><Kbd>P</Kbd></KbdGroup>, d: "Reference drawings / photos (opens the panel if it's closed)", isNew: true },
  { k: <Kbd>E</Kbd>, d: "Open or close the enlarged view of the field's reference (Esc closes it too)", isNew: true },
  { k: <Kbd>N</Kbd>, d: "Add or edit a note (Enter saves, ⇧Enter starts a new line, Esc cancels)", isNew: true },
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
            {(c.goTo || c.how) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {c.goTo && (
                  <Button asChild size="sm" variant="outline" className="w-fit">
                    <a href={c.goTo.href}>
                      {c.goTo.label} <ArrowRight data-icon="inline-end" />
                    </a>
                  </Button>
                )}
                {c.how && (
                  <span className="text-muted-foreground">
                    {!c.goTo && <span className="font-medium text-foreground">Try it: </span>}
                    {c.how}
                  </span>
                )}
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
            What's changed in the prototype, newest first. Each update says what changed and why, and how to try it;
            where a change lives in one particular section, a button takes you there. Trying them is optional. If you do, a line in the box under an update
            helps, and you can send them all at the bottom of the page.
          </p>
          <p className="text-sm text-muted-foreground">
            It's still an early, clickable prototype: nothing is saved, the case is made up, and some buttons are just for
            show. The keys are listed{" "}
            <span className="lg:hidden">at the end of the page</span>
            <span className="hidden lg:inline">on the right</span>.
          </p>
          <Button asChild className="w-fit">
            <a href={`?${new URLSearchParams({ inc: "skip-and-flag" })}#/`}>
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
              To move the reference panel, use the arrow beside Show/Hide reference. Test mode, the strip at the very
              bottom of the prototype, still has the bottom dock for comparison.
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
            <span className="size-1.5 shrink-0 rounded-full bg-primary" /> Changed on November 18
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

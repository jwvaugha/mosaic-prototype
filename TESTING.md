# Trying the prototype

**Testers:** use the in-app guide at https://jwvaugha.github.io/mosaic-prototype/#/guide (also under **Help** in the header). It has a Start button for each setup, the tasks and questions, and a button to copy your session log. The rest of this file is for the team.

Live: https://jwvaugha.github.io/mosaic-prototype/

The prototype compares one open decision: **where the reference panel appears**. The options are A (docked column), C (inline under the field) and D (bottom dock), with one layout for both modalities. A fourth option shows the panel only when asked for (`R`), opening inline.

Since the PI meeting of 2026-10-28, Skip and "come back to" are no longer alternatives. Both are available on every field, as buttons that show their shortcut (`−`, `⌥F`). When a row hasn't room for them, they fold into a "⋯" menu. The three earlier versions (Flows page 1, 2 and 2.5) can still be reached with `?inc=skip-section`, `flag-section` or `flag-end`.

Open **Test mode** with the pill in the bottom-left corner or `⌃⌥T`. Changing the scenario or the opening section starts the Workup again. **Intro card** toggles intro-dim (dimming everything but the field while the first-use card shows; `dim=0` in the URL turns it off) and can show the card again. **Copy link** shares the exact setup.

Every Region and section from the data dictionaries can be entered: 369 Variables in 15 sections, built by `npm run fixture` (see `scripts/manifest-report.md`). The 38 calculated cranial Variables are read-only. Add `start=<section id>` to the URL to open on a given section, e.g. `start=cranium-morph`.

The Region rail collapses to a strip of Region codes (the panel icon beside Edit order); below 1024 px it starts collapsed and opens over the content. It works in full: expand and collapse Regions, **+ add** a Region left out at Inventory (Thorax), **add back** a Set-aside one (Shoulder & upper limb), remove a Region from its ⋯ menu (it's set aside if it has Observations), and **Edit order** (drag, or ⌥↑/⌥↓). The order you set changes where Continue and `⌃⌥↓` go.

## Screen sizes

Laptop and tablet widths down to 768 px are supported (phones aren't yet). Below 1280 px the header turns labels into icons and the docked column narrows; below 1024 px the docked column becomes a drawer, the header's links fold into a menu, and the rail starts collapsed. `npm run e2e` checks all of this.

## Keys

| Key | Does |
| --- | --- |
| Tab / ⇧Tab | Next / previous stop: each bone's header, its Condition chips, its fields, then Continue |
| 0–9 | Score a Morphological field and move on |
| ← / → | On a Morphological field: move between states (previewed in the reference); Enter picks one |
| ← / → | On a bone header: switch Side. On Condition chips: move between chips; Space ticks one |
| Enter | Keep a Metric value and move on |
| `⌫` / Delete | Clear a Morphological score, or un-Skip |
| `-` | Skip the field, even a scored one (Undo appears). On a bone header: Skip the bone's blanks |
| `⌥F` | Mark the field to come back to |
| `R` / `?` / Esc | Open or close the reference for the field |
| `⌃⌥↓` / `⌃⌥↑` | Next / previous section, in rail order |
| F6 / Esc | Move into the Region rail / back to where you were |
| ↑ ↓ ← → Enter | In the rail: move, collapse or expand, open a section or add a Region |
| `⇧F10` | In the rail: open the Region menu |
| `⌥↑` / `⌥↓` | In Edit order: move the focused Region |

## Suggested tasks

See the in-app guide (`#/guide`): one task, repeated under the four reference-panel setups.

## Reference images

The MSU (MMS) drawings are on the public site; the PIs cleared them on 2026-10-28. The DCP 2.0 figures used for Metric fields come from a UTK manual and stay local until cleared, so Pages shows placeholders at their real sizes. To see them, run the prototype locally. It needs the MOSAIC `References` folder beside this one, plus macOS `sips` and poppler:

```sh
npm install
npm run fixture                 # extracts images into public/ref-images (git-ignored)
VITE_REAL_IMAGES=1 npm run dev  # http://localhost:5173/mosaic-prototype/
```

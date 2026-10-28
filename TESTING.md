# Trying the prototype

Live: https://jwvaugha.github.io/mosaic-prototype/

The prototype compares two open decisions in MOSAIC data entry:

1. **How the reference panel appears**: A (docked column), C (inline under the row) or D (bottom dock), set separately for Morphological and Metric fields.
2. **How incomplete fields are handled**:
   - 1 · Skip, with a check at the end of each section
   - 2 · "Come back to" flags, with a check at the end of each section
   - 2.5 · Flags, collected only in the check before the Analysis

Open **Test mode** with the pill in the bottom-left corner or `⌃⌥T`. Changing the incomplete-fields option or the scenario starts the Workup again. **Copy link** shares the exact setup.

Two sections can be entered: Cranium · Morphological and Lower limb · Metric. The other sections' counts are there to show how dense a real Workup is.

The Region rail itself works in full: expand and collapse Regions, **+ add** a Region left out at Inventory (Thorax), **add back** a Set-aside one (Shoulder & upper limb), remove a Region from its ⋯ menu (it's set aside if it has Observations), and **Edit order** (drag, or ⌥↑/⌥↓). The order you set changes where Continue and `⌃⌥↓` go.

## Keys

| Key | Does |
| --- | --- |
| Tab / ⇧Tab | Next / previous field, then the Continue button |
| 0–9 | Score a Morphological field and move on |
| Enter | Keep a Metric value and move on |
| `-` / `⇧-` | Skip the field / the bone (version 1 only) |
| `⌥F` | Mark the field to come back to (versions 2 and 2.5) |
| `?` / Esc | Open or close the reference for the field |
| `⌃⌥↓` / `⌃⌥↑` | Next / previous section, in rail order |
| F6 / Esc | Move into the Region rail / back to where you were |
| ↑ ↓ ← → Enter | In the rail: move, collapse or expand, open a section or add a Region |
| `⇧F10` | In the rail: open the Region menu |
| `⌥↑` / `⌥↓` | In Edit order: move the focused Region |

## Suggested tasks

Do each one under at least two setups. Use **Copy as JSON** in Test mode to send back your session log.

1. **Score all of Cranium · Morphological.** You can't decide Interorbital breadth yet, so leave it for later, then move on to Lower limb · Metric.
2. **In Lower limb · Metric, enter:** FemXL 452, FemBL 448, FemEB 81, FemHXD 64. Leave the midshaft diameters for later. Then run the Analysis.
3. **Compare reference layouts.** With auto-show on, Tab through Cranium · Morphological under A, then C, then D. Which one let you keep your eyes on the row?

## Reference images

The public site shows placeholders at the real image sizes, because the drawings aren't cleared for a public URL yet. To see the real drawings, run the prototype locally. It needs the MOSAIC `References` folder beside this one, plus macOS `sips` and poppler:

```sh
npm install
npm run fixture                 # extracts images into public/ref-images (git-ignored)
VITE_REAL_IMAGES=1 npm run dev  # http://localhost:5173/mosaic-prototype/
```

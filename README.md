# MOSAIC prototype

A throwaway, test-mode prototype for comparing where MOSAIC's reference panel
appears during data entry (docked column A, bottom dock B, inline C). The panel
is one on/off switch, off at first. Skip and "come back to" are both available
on every field.

Spec and tickets live in the MOSAIC project folder under `.scratch/test-mode-prototype/`.

```sh
npm install
npm run dev        # http://localhost:5173/mosaic-prototype/
npm test
```

Deployed to GitHub Pages on every push to `main`. Routes use the hash (`/#/kitchen-sink`, `/#/parts`).

How to try it, the keys, and how to see the real reference images locally: [TESTING.md](TESTING.md).

`npm run e2e` runs the Playwright browser checks in `e2e/` (with the Chrome installed on this machine): every width from 1440 down to 768 px × each reference layout, for sideways scrolling, the header fitting on one line, rows not wrapping their actions, the reference panel staying on screen, and the rail collapsing. Screenshots land in `e2e/.shots/`.

`scripts/shots.mjs` takes screenshots of each Flows-page scenario with the local Chrome (`npm run build && node scripts/shots.mjs <dir> [filter]`).

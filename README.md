# MOSAIC prototype

A throwaway, test-mode prototype for comparing where MOSAIC's reference panel
appears during data entry (docked column A, inline C, bottom dock D, or only
when asked for). Skip and "come back to" are both available on every field.

Spec and tickets live in the MOSAIC project folder under `.scratch/test-mode-prototype/`.

```sh
npm install
npm run dev        # http://localhost:5173/mosaic-prototype/
npm test
```

Deployed to GitHub Pages on every push to `main`. Routes use the hash (`/#/kitchen-sink`, `/#/parts`).

How to try it, the keys, and how to see the real reference images locally: [TESTING.md](TESTING.md).

`scripts/shots.mjs` takes screenshots of each Flows-page scenario with the local Chrome (`npm run build && node scripts/shots.mjs <dir> [filter]`).

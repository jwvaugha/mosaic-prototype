# MOSAIC prototype

A throwaway, test-mode prototype for comparing two open MOSAIC data-entry decisions:

- how the reference panel appears (docked column A, inline C, bottom dock D);
- how incomplete fields are handled (Skip vs. "come back to" flags).

Spec and tickets live in the MOSAIC project folder under `.scratch/test-mode-prototype/`.

```sh
npm install
npm run dev        # http://localhost:5173/mosaic-prototype/
npm test
```

Deployed to GitHub Pages on every push to `main`. Routes use the hash (`/#/kitchen-sink`).

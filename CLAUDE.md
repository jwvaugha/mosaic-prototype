## Design updates page

The testers' landing page (`#/guide`, `src/routes/guide.tsx`) is a changelog of the prototype, newest first. Any change a tester can see or feel ships with its entry in the same commit:

1. Add the change to `UPDATES`. If it continues the work of the top entry, add it as another change in that entry. Otherwise, put a new entry at the top, dated today.
2. Write each change for the testers, who are forensic anthropologists: say what changed and why it matters to them, without tester names. If it can be tried, add a `tryIt` link built with `tryLink({ start: "<section id>", ... })` and a one-line "how".
3. When a key's behaviour changes, update its row in `KEYS` and mark it `isNew`. Then move the "Changed on …" legend to today and clear `isNew` from keys that changed in earlier updates.

The entry is done when the top of the page describes the change and `npm run e2e` passes. Changes testers never see (tests, refactors, tooling, Test mode internals) get no entry.

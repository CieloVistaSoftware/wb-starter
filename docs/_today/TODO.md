# TODO
**Moved from `CURRENT-STATUS.md`**
**Updated:** 2026-02-06 02:00

- [ ] **FIND ALL :5174 STRINGS AND REPLACE WITH BASEURL** — themes-showcase.spec.ts was hardcoded to localhost:5174 instead of using Playwright baseURL. Audit all test files for hardcoded ports.
- [ ] **Fix builder app** — builder-app/index.js has 30+ module imports; the ES module chain breaks silently. All builder tests skipped until operational.
- [ ] **Fix schema-viewer** — #schemaSelector dropdown never populates with schemas. All schema-viewer tests skipped.
- [ ] **wb-card status** — CSS ownership migration COMPLETE (card.css created, self-load added, demo.css cleaned). Update `CURRENT-STATUS.md` table above.

- [ ] **ESM migration — convert remaining `.cjs` → `.js` (scheduled)** — Known files (whitelist for interim use):
  - `scripts/check-today-docs.cjs`
  - `scripts/verify-today-mentions.cjs`
  - `scripts/retroactive-pr-labeler.cjs`
  - `find-function.cjs`
  - `find-showprops.cjs`

  Priority: High → convert and open focused PR that:
  - Adds `scripts/<name>.js` (ESM) next to the `.cjs` file
  - Updates `package.json` scripts to point to the `.js` entrypoints
  - Adds a `Lock/LOCKED-scripts-<name>.md` during conversion
  - Includes Tier‑1 (async) run and acceptance notes in PR body

  Interim policy (use them for now):
  - Automation/AI: continue to *use* the listed `.cjs` files until the conversion PR is merged. Do **not** fail or block PRs solely for the presence of these whitelisted `.cjs` files.
  - When adding new scripts, prefer ESM `.js` (no new `.cjs` allowed).
  - Acceptance for conversion: new `.js` exists, Tier‑1 (async) passes, `package.json` updated, `.cjs` removed in the same PR or immediately after as a follow-up.

---

> NOTE: These items were moved from `CURRENT-STATUS.md` to keep the status document focused. If an item is completed, remove it from this list and update `CURRENT-STATUS.md` accordingly.

# data-wb Migration To-Do — Prioritized by Folder

**Summary**

- ~200 legacy `data-wb` / `x-legacy` occurrences found across the repo (docs, data, tests, scripts, src).
- This document lists prioritized, folder-based tasks to migrate safely (High → Medium → Low).

---

## How to use this list
- Start with **High** priority items (CI disruption risk or runtime code). Do these in small PRs with CI green before moving on. ✅
- **Medium** items are important but lower immediate risk (docs, examples). Do these in a docs-only PR first. 🔧
- **Low** items are cleanup/housekeeping; group them into bulk PRs. 🧹

---

## High Priority (do before next release) 🔥

### tests/ (Critical — avoid CI breakage)
- [ ] Update CI-critical tests to accept both forms during migration, then switch to strict `<wb-*>` selectors:
  - Files: `tests/compliance/v3-syntax-compliance.spec.ts`, `tests/regression/**`, `tests/behaviors/**`.
  - Action: add combined selectors (e.g., `wb-card, [data-wb="card"]`), run full test suite, open PR.
- [ ] Fix tests referencing `data-wb-ready` and `data-wb-skip` so they work with `wb-*` elements or document and preserve them during migration.

### src/ (Runtime fallback and helper)
- [ ] Implement a migration helper `isWbElement(el)` and replace direct `closest('[data-wb]')`, `getAttribute('data-wb')` calls with it.
  - Files to touch: `src/core/site-engine.js`, `src/wb-viewmodels/*.js`, `src/behaviors/*`.
  - Action: add `migrationMode` flag (default `true` until tests & docs converted), centralize detection logic.
- [ ] Ensure the runtime logs legacy `data-wb` occurrences (warn once per session) to aid cleanup.

### scripts/ (Safe codemods)
- [ ] Add dry-run mode and CSV output to `scripts/nuke-data-wb.js` (generate a PR-ready diff/summary first).
  - Action: `--dry-run` prints files + sample diffs; `--export-csv` emits `data-wb-report.csv`.
- [ ] Run codemod in docs-only mode first and review with human-in-the-loop PRs.

---

## Medium Priority (do after High tasks pass) ⚙️

### docs/ (Author-facing standards & examples)
- [ ] Update core standards & examples to canonical forms:
  - `docs/standards/V3-STANDARDS.md`, `docs/WB_BEHAVIOR_SYSTEM.md`, `docs/code-examples-standard.md`, `docs/behavior-cross-reference.md`.
  - Action: convert `data-wb="card"` → `<wb-card>` examples and `data-wb="ripple tooltip"` → `x-ripple x-tooltip`.
- [ ] Add clear migration notes and a short guide: “How to migrate data-wb → wb-* and x-*” (include common patterns).

### data/ (Examples used by tests/docs)
- [ ] Migrate examples in `data/FUNCTIONAL-TEST-ANALYSIS.md`, `data/*` to use canonical forms (prefer `<wb-*>` for components and `x-*` for behaviors).
  - Action: validate examples render correctly in demos and pages.

### demos/ and pages/
- [ ] Update demo pages and sample fragments to use `<wb-*>` and `x-*` where appropriate; run visual/manual smoke tests.

---

## Low Priority (cleanup, batching allowed) 🧹

### tests (non-CI)
- [ ] Update non-critical/experimental tests to new selectors and remove legacy checks after migration completes.

### docs misc & meta
- [ ] Remove or update legacy mentions in `CONTRIBUTING.md`, `IMPROVEMENTS.md`, `pricecard.md`, and `pce-candidates.md`.
- [ ] Replace remaining `data-wb` references in archived docs and legacy tutorial pages.

### public/ and assets
- [ ] Sweep `public/`, `demos/`, and `archive/` for `data-wb` references and update progressively.

---

## Rollout plan (recommended) 🚀
1. Generate full CSV export of all matches (`file,line,snippet,suggestion`). Use it as the single source of truth. ✅
2. Implement `isWbElement` helper + migrationMode in `src/` and add runtime logging. (Small PR, low-risk) ✅
3. Make tests accept both forms and run CI. Fix any failing tests. ✅
4. Run `scripts/nuke-data-wb.js --dry-run --docs-only` and open a docs-only PR with changes. Review and iterate. 🔧
5. Gradually expand codemod to `data/`, `demos/`, `pages/`, then `src/` (when helpers are in place). 🔁
6. Once tests, docs, and demos are passing, flip `migrationMode=false`, update tests to strict `<wb-*>`, and remove legacy logic. ✅

---

## Risk / Rollback notes
- Keep changes small and reviewable; prioritize PRs that modify docs only first.
- Always run full CI (Playwright tests) before merging migrations that affect runtime or tests.
- Keep `--dry-run` output and CSV attached to PRs for review and auditing.

---

## Quick checklist (actionable)
- [ ] Export full CSV of matches
- [ ] Add dry-run & CSV export to `scripts/nuke-data-wb.js`
- [ ] Implement `isWbElement` helper and migration flag
- [ ] Update CI-critical tests to accept both forms
- [ ] Docs-only PR with canonical examples
- [ ] Run codemod on docs, review, merge
- [ ] Expand codemod to data/demos/pages and update tests to strict `<wb-*>`

---

If you want, I can now: generate the CSV, add the dry-run feature to `scripts/nuke-data-wb.js`, or open a docs-only PR with the first batch of replacements — which would you like me to do next?

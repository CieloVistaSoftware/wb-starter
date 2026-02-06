# Current Status - CSS Ownership Migration Phase 1
**Updated:** 2026-02-06 02:00

## CSS Ownership Migration — Option A (co-locate with ViewModels)

### ✅ COMPLETED Extractions
Moved to `FIXES.md` — see `docs/_today/FIXES.md` for details.

### ⏳ REMAINING Phase 1
- [ ] **wb-card** — has `behaviors/card.css` + competing `demo.css` styles. Needs consolidation.
- [ ] **wb-table** — TRIPLE defined (demo.css, site.css, components.css). Needs consolidation.

### Phase 2 (Duplicate Resolution)
- [ ] wb-dialog (site.css + components.css)
- [ ] wb-switch (demo.css + components.css — different implementations)
- [ ] wb-progress (all three files)

### Phase 3 (Remaining 20 demo.css components)
- Not started

## Test Results After Badge Fix
- Badge tests: 14 pass, 3 fail (down from 9 fails)
- All badge-specific tests PASS (wb-badge, x-badge, pill, header badge)
- 3 remaining fails were infrastructure: themes-showcase (wrong port), builder-mkel (builderAPI broken), schema-viewer (schemas not loading)
- themes-showcase: FIXED (was hardcoded :5174, changed to relative URL)
- builder-mkel + all builder tests: SKIPPED (builder app not operational, AI regressed it)
- schema-viewer: SKIPPED (schema dropdown never populates)

## MCP Server v2.0 — Async Test Execution
- `npm_test_async` launches tests in background, returns immediately
- Progress written to `data/test-status.json` every 2 seconds
- Final results in `data/test-results.json`
- `npm_command` blocks all test commands — only `npm_test_async` allowed
- Only John runs sync tests at the console
- AI agents: poll `data/test-status.json` 1x per minute, if 3+ failures stop and fix

## TODO
Moved to `TODO.md` — see `docs/_today/TODO.md`.

## Architecture Decision
- **Option A**: CSS co-located next to ViewModels in `src/wb-viewmodels/`
- **Future**: Option C (full MVVM component folders) to be revisited later

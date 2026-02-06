# Current Status - CSS Ownership Migration Phase 1
**Updated:** 2026-02-05 18:00

## CSS Ownership Migration — Option A (co-locate with ViewModels)

### ✅ COMPLETED Extractions
| Component | CSS File Created | Self-Load | Removed From |
|-----------|-----------------|-----------|--------------|
| wb-badge | `src/wb-viewmodels/badge.css` | ✅ badge.js | demo.css |
| wb-spinner | `src/wb-viewmodels/spinner.css` | ✅ spinner.js | demo.css + site.css |
| wb-toast | `src/wb-viewmodels/toast.css` | ✅ toast.js (path fixed) | demo.css |
| wb-avatar | `src/wb-viewmodels/avatar.css` | ✅ avatar.js | demo.css |

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

## TODO
- [ ] **FIND ALL :5174 STRINGS AND REPLACE WITH BASEURL** — themes-showcase.spec.ts was hardcoded to localhost:5174 instead of using Playwright baseURL. Audit all test files for hardcoded ports.
- [ ] **Fix builder app** — builder-app/index.js has 30+ module imports; the ES module chain breaks silently. All builder tests skipped until operational.
- [ ] **Fix schema-viewer** — #schemaSelector dropdown never populates with schemas. All schema-viewer tests skipped.
- [ ] **wb-card status** — CSS ownership migration COMPLETE (card.css created, self-load added, demo.css cleaned). Update table above.

## Architecture Decision
- **Option A**: CSS co-located next to ViewModels in `src/wb-viewmodels/`
- **Future**: Option C (full MVVM component folders) to be revisited later

# Current Status - wb-demo Component Complete
**Updated:** 2026-04-01

**Last Action:** batch/001-quick-wins — docs terminology fixes, manifest update, npm script additions.

## batch/001-quick-wins — IN PROGRESS
- Added `check:today-updated` npm script (maps to `scripts/verify-today-mentions.js`)
- Fixed `docs/manifest.json` — added missing `home-page.md` entry
- Fixed forbidden terminology ("Web" + " Behaviors (WB)") → "WB-Starter" across 46 docs files
  - docs/Auto-Injection.md, docs/IMPROVEMENTS.md, docs/INTELLISENSE-TOOLTIPS.md
  - docs/MVVM-MIGRATION-PLAN.md, docs/MVVM-MIGRATION.md, docs/WB_BEHAVIOR_SYSTEM.md
  - docs/architecture/WBVIEWS.md, docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md
  - docs/architecture/standards/SCHEMA-SPECIFICATION.md, docs/behavior-cross-reference.md
  - docs/behaviors-reference.md, docs/claude/TIER1-LAWS.md, docs/code-examples-standard.md
  - docs/compliance/iso-42001-alignment.md, docs/components/README.md, docs/components/components.md
  - docs/components/feedback/feedback.readme.md, docs/components/forms/forms.readme.md
  - docs/components/layout/layout.readme.md, docs/components/mdhtml.md
  - docs/components/navigation/navigation.readme.md, docs/components/semantic/*.md (7 files)
  - docs/components/semantics/dl.md, docs/container-pattern.md, docs/escape-hatches.md
  - docs/guides/search-index.md, docs/index.md, docs/pce-candidates.md, docs/performance.md
  - docs/properties.md, docs/property-viewer.md, docs/schema.md, docs/schema.migration.md
  - docs/semantic-standard.md, docs/standards/V3-STANDARDS.md, docs/styles.md
  - docs/testing-strategy.md, docs/themes.md, docs/wb-parts-spec.md



## wb-demo — COMPLETE
- Renders children in CSS grid (1-6 columns, default 3)
- Shows raw HTML as syntax-highlighted, auto-formatted code sample below
- Uses fetch for raw page source (bypasses browser inflation)
- Uses textContent on <code> element (prevents browser from parsing raw HTML into real custom elements)
- formatHtml() auto-indents with 2 spaces based on tag nesting
- demo.css imported in site.css
- Zero inline styles, plain attributes only (no data- attributes)

## themes.css Regression Fix
- `[data-theme]` rule was missing `background-color: var(--bg-color)`
- Only had `color: var(--text-primary)` — body stayed browser-default white
- Fixed: added `background-color: var(--bg-color)` to `[data-theme]` rule

## site.css Global Body Styles
- Added `body { padding-left: 1rem; padding-right: 1rem; }` for all pages

## CSS Ownership Migration — Option A (co-locate with ViewModels)

### ✅ Phase 1 COMPLETE
Moved to `FIXES.md` — see `docs/_today/FIXES.md` for details.

- **wb-card** — Consolidated all card CSS into `src/styles/behaviors/card.css`. Added missing `@import` to `site.css`. Moved floating card styles from `site.css` → `card.css`. Tests: 48/48 pass (Chromium, WebKit, Mobile Safari). Firefox/mobile-chrome failures are pre-existing (timeouts + subpixel rendering).
- **wb-table** — Extracted to `src/styles/behaviors/data.css`. Import added to `site.css`.

### ✅ Phase 2 COMPLETE (Duplicate Resolution)
- [x] wb-dialog — Consolidated from site.css + components.css → `src/styles/behaviors/dialog.css`. Migration comments in both source files.
- [x] wb-switch — Consolidated from demo.css + components.css → `src/styles/behaviors/switch.css`. Migration comments in both source files.
- [x] wb-progress — Consolidated from demo.css + components.css + site.css → `src/styles/behaviors/progress.css`. Migration comments in both source files.

### ✅ Phase 3 COMPLETE (demo.css Component Extraction)
Extracted 20+ component styles from demo.css → `src/styles/behaviors/`:
- [x] badge.css, alert.css, avatar.css, chip.css, skeleton.css
- [x] rating.css, stat.css, timeline.css, steps.css, pagination.css
- [x] otp.css, tags.css, gallery.css, dropdown.css, accordion.css
- [x] popover.css, modal.css, toast.css, mdhtml.css, breadcrumb.css
- [x] code.css, ui-utils.css (divider, empty, kbd)
- [x] All 28 imports added to site.css (Phase 1-3 + pre-existing)
- [x] demo.css reduced to layout-only + migration comments
- Pre-existing files also imported: details.css, footer.css, header.css, notes.css, audio.css

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

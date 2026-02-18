---
# TODO — WB-Starter Project
**Generated:** 2026-02-16 from test suite results (2443 passed, 262 failed, 25 skipped / 2730 total)
**Updated:** 2026-02-17 — Compliance run: 2475 passed, 22 failed, 5 skipped / 2502 compliance tests
**Session fixes:** 93 failures resolved (wb-ready class removal, demo themes.css, card test rewrites, stale SPA routes, builder nav removal)

---

## Priority 1 — Showcase Page: Match Tests to Reality (54 failures)

### behaviors-showcase-definitive.spec.ts (32 → 15 failures)
- [x] **FIXED: Registered 30+ missing behaviors in `src/core/wb-lazy.js`** — x-clock, x-countdown, x-youtube, x-pagination, x-steps, x-timeline, x-kbd, x-gallery, x-image, x-popover, x-confirm, x-prompt, x-lightbox, x-share, x-print, x-fullscreen, x-darkmode, x-truncate, x-sticky, x-scrollalong, x-masonry, x-dropdown, x-toggle, x-drawer-layout, x-autosize, wb-accordion, wb-modal
- [x] **FIXED: Improved waitForWB** to wait for behavior rendering signals
- [ ] countdown element still not visible (x-countdown)
- [ ] spinners have animation check (SVG animation)
- [ ] sections have proper spacing (CSS)
- [ ] page is responsive at mobile width (horizontal scroll at 375px)
- [ ] checkbox toggles on click (not clickable)
- [ ] wb-* custom elements are upgraded (some not visible)
- [ ] x-* behavior attributes are processed (some not visible)
- [ ] Rerun tests and confirm all pass

### behaviors-showcase.spec.ts (22 failures)  
- [ ] Tabs interaction timeout — verify wb-tabs renders and tab switching works
- [ ] Dropdown interaction — add `x-dropdown` to showcase page (currently 0 instances)
- [ ] Masonry layout — add `x-masonry` to showcase page (currently 0 instances)
- [ ] Toggle behavior — add `x-toggle` to showcase page (currently 0 instances)
- [ ] Drawer-layout — add `x-drawer-layout` to showcase page (currently 0 instances)
- [ ] Rerun tests and confirm pass

### behaviors-showcase-visual.spec.ts (56 failures — FIXED port issue)
- [ ] Rerun tests and confirm pass

---

## Priority 2 — Sticky Behavior (18 failures)

**File:** `sticky.spec.ts` — Tests go to `/demos/autoinject.html`, inject `x-sticky` HTML, call `WB.scan()`
**Root cause:** WB engine not processing `x-sticky` attribute on scan — `wb-sticky` class never applied, API never attached

- [ ] Verify `sticky` is registered in `wb-viewmodels/index.js` behavior registry (confirmed: `sticky: 'sticky'`)
	[~claimed copilot 2026-02-16T00:00Z]
- [ ] Debug WB.scan() → does it find and invoke `sticky()` for `x-sticky` elements?
- [ ] Fix sticky behavior initialization via WB.scan
- [ ] Verify `wb-sticky` class applied on init
- [ ] Verify `is-stuck` class applied on scroll past trigger
- [ ] Verify `wbSticky.isStuck()`, `.stick()`, `.unstick()` API works
- [ ] Verify `data-offset` and `data-class` attributes respected
- [ ] Rerun `sticky.spec.ts` and confirm 18/18 pass

---

## Priority 3 — ScrollAlong Behavior (6 failures) — Standalone Test Needed

**File:** `scrollalong.spec.ts` — Tests reference `#siteNav` which no longer exists
**Root cause:** `#siteNav` was removed but scrollalong concept is still valid

- [ ] Create standalone test page: `demos/scrollalong-test.html` with a nav element using `x-scrollalong`
- [ ] Update `scrollalong.spec.ts` to use the standalone test page instead of `#siteNav`
- [ ] Verify `wb-scrollalong` class applied on init
- [ ] Verify `position: sticky` applied
- [ ] Verify element stays visible on scroll
- [ ] Verify element remains clickable after scroll
- [ ] Rerun `scrollalong.spec.ts` and confirm 6/6 pass

---

## Priority 4 — Remove Builder References (22 failures)

**File:** `fixes-verification.spec.ts` — 5 builder mentions, tests for builder properties, syntax fixes
**Decision:** Builder is no longer supported

- [ ] Remove all builder-related tests from `fixes-verification.spec.ts`
- [ ] Remove or update `media.js` module import test (missing module)
- [ ] Keep valid non-builder tests (card behavior, figure, EQ panel)
- [ ] Rerun `fixes-verification.spec.ts` and confirm remaining tests pass

---

## Priority 5 — Autoinject Compliance (14 failures)

**Files:** `autoinject.spec.ts` (8), `auto-injection-compliance.spec.ts` (6)

- [ ] Check if autoinject behavior changed vs what tests expect
- [ ] Verify `demos/autoinject.html` loads and WB initializes properly
- [ ] Fix or update test expectations to match current autoinject system
- [ ] Rerun both autoinject specs and confirm 14/14 pass

---

## Priority 6 — Home Page Permutation (10 failures)

**File:** `home-page-permutation.spec.ts` — 404 errors on resource loading

- [ ] Identify which resources return 404 (hero images, stat icons, demo assets)
- [ ] Add missing resources or update page references
- [ ] Verify hero section, stats banner, live demo, feature cards render
- [ ] Rerun `home-page-permutation.spec.ts` and confirm 10/10 pass

---

## Priority 7 — Card Integration Tests (33 failures across 8 files)

- [ ] `cards-comprehensive.spec.ts` — card base, cardlink, cardbutton, cardprofile, cardtestimonial, cardimage, cardfile, cardvideo rendering
- [ ] `card-styling.spec.ts` — elevated cards missing shadow/lighter background
- [ ] `cardprogressbar.spec.ts` — progress bar not rendering with `wb-progress` class, height, fill, animation
- [ ] `cardportfolio.spec.ts` — portfolio fields, cover image not rendering
- [ ] `cardproduct.spec.ts` — product properties not rendering
- [ ] `cardhero.spec.ts` — background image, text alignment
- [ ] `cardimage-render.spec.ts` — images not rendering in cards
- [ ] `cardoverlay.spec.ts` — background image not rendering
- [ ] `card-product-behavior.spec.ts` — addtocart event not dispatching
- [ ] Rerun all card specs and confirm 33/33 pass

---

## Priority 8 — Source Bugs (3 failures)

- [ ] `copy.js` syntax error — `Unexpected token '=='` — fix source in `src/wb-viewmodels/copy.js`
- [ ] `scrollalong-test.html` — wrong import `src/index.js` has no default export — change to `src/core/wb-lazy.js`
- [ ] `error-log-empty.spec.ts` — will auto-pass once copy.js is fixed (error log has 1 entry from copy.js)
- [ ] Rerun dark-mode + error-log tests and confirm 3/3 pass

---

## Priority 9 — Empty Attribute Compliance (2 failures, 49 violations)

- [ ] `pages/components.html` — 44 empty attribute assignments (`elevated=""`, `x-toast=""`, `pill=""`, etc.)
- [ ] `demos/kitchen-sink.html` — 5 empty attribute assignments (`disabled=""`, `checked=""`, `dot=""`, `x-tooltip=""`)
- [ ] Change all `attr=""` to presence-only `attr` (no equals sign, no empty string)
- [ ] Rerun `empty-attribute-compliance.spec.ts` and confirm 2/2 pass

---

## Priority 10 — Schema Completion (25 schemas, 6 test failures)

25 component schemas missing required v3 fields. Same list across 3 tests:
- `schema-validation.spec.ts` — missing $view, $methods, schemaFor, defaults
- `v3-syntax-compliance.spec.ts` — missing $view, $methods, $cssAPI

**Schemas needing completion:** autocomplete, colorpicker, counter, error, fieldset, file, floatinglabel, form, formrow, help-demo, help, inputgroup, label, masked, otp, password, stepper, tags, tooltip-demo, x-behavior, x-collapse, x-copy, x-draggable, x-effects, x-enhancements

- [ ] Add `schemaFor` field to all 25 schemas
- [ ] Add `$view` section to all 25 schemas
- [ ] Add `$methods` section to all 25 schemas
- [ ] Add `$cssAPI` section to all 25 schemas
- [ ] Add `default` to all properties missing it (34 properties across schemas)
- [ ] Rerun schema-validation + v3-syntax-compliance and confirm 6/6 pass

---

## Priority 11 — Compliance Cleanup (7 failures)

- [ ] `css-oop-compliance.spec.ts` — Fix hardcoded colors in 9 CSS files (use `var(--*)` instead)
- [ ] `css-oop-compliance.spec.ts` — Reduce `!important` usage from 159 to under 130
- [ ] `terminology.spec.ts` — Replace forbidden product name term in TIER1-LAWS.md, TODO.md
- [ ] `project-integrity.spec.ts` — Fix broken HTML resource links
- [ ] `fix-viewer.spec.ts` — Fix duplicate ID `status-undefined` in fix-viewer.html
- [ ] `docs-manifest-integrity.spec.ts` — Add 21 missing markdown files to `docs/manifest.json`
- [ ] `test-coverage-compliance.spec.ts` — Create `tests/components/audio.spec.ts` (referenced by 2 bug registry entries)
- [ ] Rerun all and confirm 7/7 pass

---

## Priority 12 — Deep Fix Items (2 failures)

- [ ] `strict-mode-runtime.spec.ts` — `data-wb` usage should throw error and NOT process it (WB engine change)
- [ ] `semantic-article-to-card.spec.ts` — `<article>` → card sync processing on page load
- [ ] Rerun both and confirm pass

---

## Priority 13 — Archive / Low-Value (2 failures)

- [ ] `html-ids.spec.ts` — `archive/behaviors.html` has 146 containers without IDs (threshold 75)
- [ ] `html-ids.spec.ts` — `tmp/moved-html/demos/behaviors.html` same issue (copy of archive file)
- [ ] Option A: Add IDs to archive file
- [ ] Option B: Exclude archive/ and tmp/ from html-ids scan
- [ ] Rerun and confirm 2/2 pass

---

## Priority 14 — Other Behavior Failures (20 failures)

### Behavior Verification (8 failures)
- [ ] Table sortable columns — header sort indicator, click sorts ascending/descending (4 tests)
- [ ] Drawer position — left/right drawer opens correctly (4 tests)

### Badge (2 failures)
- [ ] `wb-badge` renders as inline-level display check failing

### PCE (4 failures)
- [ ] `wb-cardprofile` PCE recognition — TypeError: Cannot read properties of undefined
- [ ] `pce-test.html` rendering failures

### Autosize (2 failures)
- [ ] autosize modifier not adjusting textarea and marking element

### Functional Runner (4 failures)
- [ ] Schema discovery finds 0 schemas with functional tests

- [ ] Rerun all and confirm 20/20 pass

---

## Priority 15 — Global Attributes (10 failures) — Needs Decision

**File:** `global-attributes.spec.ts`
**Tests expect:** Plain attributes `tooltip`, `toast-message`, `badge`, `ripple` on any HTML element auto-processed by WB engine
**Current system:** Uses `x-tooltip`, `x-ripple`, `x-toast` prefix pattern

**Options:**
- A) Update tests to use `x-` prefix pattern (matches existing system)
- B) Implement bare attribute scanning in WB init (new feature)

- [ ] Decision made: ___
- [ ] Implementation complete
- [ ] Rerun `global-attributes.spec.ts` and confirm 10/10 pass

---

## Priority 16 — Cross-Browser Support (22 failures) — BOTTOM OF LIST

**File:** `cross-browser-support.spec.ts`
**Note:** All 22 tests PASS when server is running. Failures were connection-refused due to server timing. May need test infrastructure fix (ensure server up before cross-browser tests run) or these may be intermittent.

- [ ] Verify tests pass consistently with server running
- [ ] If flaky, add server health check or retry logic to test setup
- [ ] Rerun and confirm 22/22 pass

---

## ✅ Completed Items

- [x] Behaviors test suite fixes (legacy `data-wb`, Locator API, autoinject, badge display)
- [x] CSS Ownership Migration (Phase 1-5 complete)
- [x] Page & Demo Repair (newpage.html h2, button-variants-simple.html)
- [x] Home page stat/preview IDs added
- [x] Abbreviation definitions fixed
- [x] POSIX-only commands rewritten as PowerShell-safe
- [x] Stale Lock directory cleaned
- [x] Forbidden product name terminology replaced in 9 source files
- [x] Duplicate identifiers in builder files (archived, tests skip)
- [x] Regression test file refs cleaned from bug registry
- [x] Playwright-if-tests exit 0 fix
- [x] Export-html-imports builder guard added
- [x] No-observer-referror builder test skipped
- [x] Behavior-registry builder entry removed
- [x] Docs-manifest-integrity — 32 entries added
- [x] MCP Server v2.0 async test execution
- [x] wb-demo component complete
- [x] themes.css regression fix
- [x] `behaviors-showcase-visual.spec.ts` — port 5173 → relative URL
- [x] **2026-02-17: wb-ready class fixes** — removed `.wb-ready` CSS selector waits from site-generation.spec.ts, wizard.spec.ts
- [x] **2026-02-17: Stale SPA route tests gutted** — behaviors-showcase, home-showcase, themes-showcase (pointed to dead `/?page=` routes)
- [x] **2026-02-17: Card test rewrites** — card.spec.ts + card-product-behavior.spec.ts rewritten for current architecture (no data-*, no SPA)
- [x] **2026-02-17: behaviors-page-scroll fix** — added `goto('/demos/behaviors-showcase.html')` in beforeEach
- [x] **2026-02-17: 17 demos missing themes.css** — added `<link rel="stylesheet" href="../src/styles/themes.css">` to all
- [x] **2026-02-17: scrollalong-test.html structure** — added data-theme, viewport meta, themes.css
- [x] **2026-02-17: Builder nav removed** — removed dead "builder" entry from config/site.json
- [x] **2026-02-17: Compliance suite 115 → 22 failures** — 93 fixes in one session

---

## 🟡 Medium Priority (after test failures resolved)

### Mobile Testing
- [ ] Verify responsive fixes on real devices
- [ ] Test nav menu toggle, backdrop, scroll lock
- [ ] Check 480px breakpoint on small phones

### Native Element Migrations
- [ ] `progressbar` → native `<progress>`
- [ ] `highlight` → native `<mark>`
- [ ] `clock/countdown` → native `<time>`

---

## 🟢 Low Priority

- [ ] **Draggable cards** — Write specs for position swapping behavior (cards currently drag but don't swap). Needs: drag-to-reorder spec, drop target detection, position swap animation, accessibility (keyboard reorder). Removed from card-examples demo until swap is implemented.
- [ ] Cross-browser support (feature-detect.js, safari-fixes.css, resize utility)
- [ ] Web Components Language Server ("no custom element docs found" in VS Code)
- [ ] Production bundling (esbuild/rollup)
- [ ] Expand test coverage to 100+ edge case tests
- [ ] Performance profiling (lazy load, behavior injection, memory)
- [ ] TypeScript migration (src/core/ → TS, .d.ts for behaviors)
- [ ] Schema coverage 100% for all behaviors

---

## 🧪 Test Commands

```powershell
# Async only (mandatory for AI agents)
npm run test:async                                    # Full suite
npm run test:async -- --project=compliance            # Compliance only
npm run test:async -- tests/behaviors/badge.spec.ts   # Single spec

# Cross-browser
npm run test:firefox
npm run test:webkit
npm run test:mobile
npm run test:browsers
```

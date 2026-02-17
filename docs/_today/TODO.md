---
# TODO — WB-Starter Project
**Generated:** 2026-02-16 from test suite results (2443 passed, 262 failed, 25 skipped / 2730 total)
**Updated:** 2026-02-16 — Prioritized action items with completion tracking

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

## Priority 8 — Compliance Tests (7 failures)

- [ ] `css-oop-compliance.spec.ts` — Fix hardcoded colors in CSS (except themes.css)
- [ ] `css-oop-compliance.spec.ts` — Reduce excessive `!important` usage
- [ ] `terminology.spec.ts` — Find and replace forbidden term "WB Framework" 
- [ ] `project-integrity.spec.ts` — Fix HTML resource links pointing to non-existent files
- [ ] `page-compliance.spec.ts` — Fix root page `/` compliance failure
- [ ] `universal-compliance.spec.ts` — Fix root page `/` universal compliance failure
- [ ] `fix-viewer.spec.ts` — Fix duplicate IDs in fix viewer
- [ ] Rerun compliance specs and confirm 7/7 pass

---

## Priority 9 — Deep Fix Items (2 failures)

- [ ] `strict-mode-runtime.spec.ts` — `data-wb` usage should throw error and NOT process it (WB engine change)
- [ ] `semantic-article-to-card.spec.ts` — `<article>` → card sync processing on page load
- [ ] Rerun both and confirm pass

---

## Priority 10 — Other Behavior Failures (20 failures)

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

## Priority 11 — Global Attributes (10 failures) — Needs Decision

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

## ✅ Completed Items

- [x] Behaviors test suite fixes (legacy `data-wb`, Locator API, autoinject, badge display)
- [x] CSS Ownership Migration (Phase 1-5 complete)
- [x] Page & Demo Repair (newpage.html h2, button-variants-simple.html)
- [x] Home page stat/preview IDs added
- [x] Abbreviation definitions fixed
- [x] POSIX-only commands rewritten as PowerShell-safe
- [x] Stale Lock directory cleaned
- [x] Forbidden "WB Framework" terminology replaced in 9 source files
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

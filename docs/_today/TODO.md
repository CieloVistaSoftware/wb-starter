# TODO List

**Last Updated:** 2026-02-09  
**Source:** CURRENT-STATUS.md

---

## ❓ Questions (for automation / AI)
Use this section to post short, machine-actionable questions for other AI agents. Follow the exact format below so agents can claim and respond automatically.

- Format (required):
  - `QID:` `q-YYYYMMDD-NN`  — unique question id
  - `Title:` one-line summary
  - `Priority:` low | medium | high
  - `Context:` relative path(s) and short pointer (file:line or PR#)
  - `Question:` single clear question (1-2 sentences)
  - `Expected output:` checklist of artifacts (log, PR, CSV, command to run)

- Claiming & answering (must follow):
  1. Claim by editing this line to: `[~claimed <agent-id> <iso-ts>]` immediately under the question.
  2. Run the required commands and attach logs/results to the question's PR or comment.
  3. Answer format (machine-parseable):
     - `QID:` q-YYYYMMDD-NN
     - `Status:` answered | blocked | need-human
     - `Answer:` short text (1-3 lines)
     - `Artifacts:` `data/` path(s) or PR#/ISSUE#
     - `Resolved-by:` `<agent-id>` `<iso-ts>`
  4. Mark the question complete by replacing the checklist with `[x]` and add a 1-line `docs/_today/TODO.md` follow-up if needed.

- SLA / expectations: aim to respond within 15 minutes for `high`, 4 hours for `medium`, 24 hours for `low`.

### Active Questions

- [x] QID: q-20260206-03 ✅
  Title: Fix test-async.mjs detached process not releasing parent
  Priority: **high** — **RESOLVED 2026-02-09**
  Answer: Already fixed. Two-phase architecture (launcher→monitor) with `detached:true`, `stdio:"ignore"`, `unref()`. Verified: returns in <1s.

- [x] QID: q-20260206-02 ✅
  Title: Run retroactive PR labeler on main
  Priority: **medium** *(downgraded from high — 3 days stale, verify if still needed)*
  Context: MERGE-PLAN item 11, scripts/retroactive-pr-labeler.js on main branch
  Question: Now that PRs #98-#104 are merged to main, run `node scripts/retroactive-pr-labeler.js --apply` on main to retroactively label open PRs needing Tier-1. Report results.
  Expected output: `data/retro-labeler-report.csv`, console output showing which PRs were labeled, 1-line summary here.
  **COMPLETED:** Script executed successfully. Labeled 1 PR (#108) with "needs-tests" label and added automated comment. Generated `data/retro-labeler-report.csv` showing 50+ PRs identified as needing Tier-1 checks. Note: jq parsing error occurred but didn't prevent labeling.

- [x] QID: q-20260206-04 ✅
  Title: Restore MERGE-PLAN.md to main
  Priority: **medium** *(downgraded from high — 3 days stale, verify if still needed)*
  Context: docs/_today/MERGE-PLAN.md — existed on announce-test-policy branch but not on main after merge
  Question: The MERGE-PLAN.md file was edited on `chore/docs/announce-test-policy-impl` but the version with updated async test rules never landed on main. Please restore it from that branch, update items 7-10 to `[x] merged to main`, and commit to main.
  Expected output: `docs/_today/MERGE-PLAN.md` on main with all 10 items checked off, committed and pushed.
  **COMPLETED:** Restored MERGE-PLAN.md with all 10 items marked as completed. Committed to branch `chore/restore-merge-plan-20260210` and pushed for review.

---

## 🔴 High Priority

### ✅ Fix test-async.mjs Detached Process (q-20260206-03)
- ~~Parent process hangs ~203s instead of exiting immediately~~
- **RESOLVED** — Two-phase launcher/monitor architecture already in place. Tested: returns in <1s.

### x- Prefix Migration
- [ ] **Phase 1: Core Infrastructure** (see `docs/architecture/CODE-AUDIT-X-MIGRATION.md`)
  - [ ] Update `src/core/wb.js` - add custom element + x-* scanning
  - [ ] Create `src/core/tag-map.js` - tag-to-behavior mapping
  - [ ] Create `src/core/extensions.js` - extension behavior registry
- [ ] **Phase 2: Behaviors** - Update attribute names (title→heading, type→variant)
- [ ] **Phase 3: Builder** - Generate new syntax
- [ ] **Phase 4: HTML Pages** - Convert ~200 files
- [ ] **Phase 5: Tests** - Update fixtures
- [ ] **Phase 6: Schemas** - Add customElement metadata
- [ ] **Phase 7: Documentation** - Update examples

### Native Element Migrations *(upgraded from medium — quick wins, modernizes framework)*
- 🔲 **`progressbar` → native `<progress>`** — Use `<progress value="..." max="100">`, maintain existing API *(claimed)*
- [x] **`search` → native `<search>` wrapper** — **CANCELLED: `<input x-search>` is correct HTML5 + behavior pattern**
- [ ] **`highlight` → native `<mark>`** — Replace custom highlighting, preserve styling
- [ ] **`clock/countdown` → native `<time>`** — Use `<time datetime="...">`, add machine-readable timestamps

---

## 🟡 Medium Priority

### Builder Fixes *(downgraded from high — builder app not operational, AI regressed it)*
- [ ] **Fix Config Loading Bug** — Builder properties panel crashes when `propertyconfig.json` missing. Add fallback: `fetch(...).catch(() => ({}))`. File: `src/builder/builder-properties.js`
- [ ] **Fix Builder Sidebar Tests (4 failing)** — Workflow overlay (`#wfOverlay`) blocks click events. Tests need to dismiss overlay before interacting. File: `tests/behaviors/ui/builder-sidebar.spec.ts`

### Builder Polish
- [ ] Integrate `builder-drop-handler.js` into `builder.js` — wire up smart drop handling
- [ ] Add visual feedback during drag — implement `getDragFeedback()` calls, show drop zone indicators
- [ ] Add effects dropdown to property panel — list available modifiers, allow applying/removing

### Mobile Testing on Real Devices
- [ ] Verify responsive fixes on actual phones
- [ ] Test nav menu toggle, backdrop, scroll lock
- [ ] Check 480px breakpoint on small phones

---

## 🟢 Low Priority

### Web Components Language Server Issue *(downgraded from high — not blocking anything)*
- [ ] VS Code shows "no custom element docs found" errors
- [ ] Custom Elements Manifest exists at `data/custom-elements.json` (101KB)
- [ ] May need VS Code restart or extension configuration

### Production Bundling
- [ ] Currently 60+ separate JS files
- [ ] Consider esbuild or rollup for single bundle
- [ ] Keep lazy loading benefits

### Expand Test Coverage
- [ ] Current: 26 cross-browser tests + existing suite
- [ ] Target: 100+ tests total
- [ ] Add edge case coverage for behaviors

### Performance Profiling
- [ ] Measure lazy load impact
- [ ] Profile behavior injection time
- [ ] Check memory usage with many behaviors

### TypeScript Migration (gradual)
- [ ] Start with `src/core/` files
- [ ] Add `.d.ts` declarations for behaviors
- [ ] Improves IDE support and catches errors

### Schema Coverage
- [ ] Currently ~80% of behaviors have schemas
- [ ] Missing: some layout and effect behaviors
- [ ] Target: 100% for builder compatibility

### Split Remaining Large Files (if needed)
- [ ] `builder-template-browser.js` (75KB) → 3-4 modules
- [ ] `builder-templates.js` (75KB) → template data, rendering
- [ ] `builder-editing.js` (56KB) → 2-3 modules
- [ ] `builder-tree.js` (41KB) → tree view, selection

---

## ✅ Completed

### CSS Ownership Migration (2026-02-09)
- [x] Phase 1: wb-card, wb-table extracted
- [x] Phase 2: Duplicate resolution (dialog, switch, progress)
- [x] Phase 3: 20+ component styles extracted from demo.css → `src/styles/behaviors/`
- [x] 40 behavior CSS files total, `components.css` emptied, `demo.css` layout-only
- [x] All 28 imports added to site.css
- [x] Badge tests fixed (14 pass, 3 infrastructure skipped)
- [x] themes-showcase port fix

### Cross-Browser Support Infrastructure (2026-01-14)
- [x] CSS Normalization, Safari/WebKit Fixes, ResizeObserver Utility
- [x] Feature Detection (no UA sniffing), Escape Hatches Documentation
- [x] Cross-browser test suite (26 tests passing)
- [x] Playwright projects: Firefox, WebKit, Mobile Chrome, Mobile Safari

### VS Code Custom Elements Support (2026-01-14)
- [x] Custom Elements Manifest generator + generated `data/custom-elements.json` (54 components)

### Builder Module Split (earlier)
- [x] Split `builder-app/index.js` from 123KB to 26KB (79% reduction)
- [x] Created 7 new modules

### HTML Parts System (earlier)
- [x] `<wb-part>` system with interpolation, conditionals, loops
- [x] Part registry (12 parts), IntelliSense support, documentation

---

## 🧪 Test Commands

```bash
# Async only (mandatory for AI agents)
npm run test:async                     # Full suite
npm run test:async -- --project=compliance  # Compliance only
npm run test:async -- tests/behaviors/badge.spec.ts  # Single spec

# Cross-browser
npm run test:firefox
npm run test:webkit
npm run test:mobile
npm run test:browsers

# Utilities
npm run test:ui          # Playwright UI mode
```

---

## Quick Reference

```bash
npm start                           # http://localhost:3000
node scripts/generate-custom-elements.js  # Regenerate CEM
```

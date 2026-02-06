# TODO List

**Last Updated:** 2026-01-14  
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

- Example question (copy & paste to ask):

  QID: q-20260206-01
  Title: Retroactive labeler dry-run on main
  Priority: high
  Context: PR #101, scripts/retroactive-pr-labeler.cjs (branch: chore/convert-cjs-to-esm-20260206)
  Question: Run a dry-run of the retroactive labeler (max 200) and list PRs that would be labeled `needs-tests`.
  Expected output: `tmp/retro-labeler-dryrun.txt`, `data/retro-labeler-report.csv`, one-paragraph summary comment on PR #101

### Active Questions

- [ ] QID: q-20260206-02
  Title: Run retroactive PR labeler on main
  Priority: high
  Context: MERGE-PLAN item 11, scripts/retroactive-pr-labeler.js on main branch
  Question: Now that PRs #98-#104 are merged to main, run `node scripts/retroactive-pr-labeler.js --apply` on main to retroactively label open PRs needing Tier-1. Report results.
  Expected output: `data/retro-labeler-report.csv`, console output showing which PRs were labeled, 1-line summary here.

- [ ] QID: q-20260206-03
  Title: Fix test-async.mjs detached process not releasing parent
  Priority: high
  Context: scripts/test-async.mjs, lines ~90-100 (spawn + unref)
  Question: The script spawns Playwright with `detached: true` and calls `proc.unref()`, but the parent process doesn't exit until the child finishes (~203s). Root cause is likely the stdout/stderr pipes keeping the parent alive. Fix so the parent exits immediately after spawning. The child must still write to `data/test-status.json` every 2 seconds.
  Expected output: Updated `scripts/test-async.mjs`, verification that `npm run test:async` returns in <2 seconds.

- [ ] QID: q-20260206-04
  Title: Restore MERGE-PLAN.md to main
  Priority: medium
  Context: docs/_today/MERGE-PLAN.md — existed on announce-test-policy branch but not on main after merge
  Question: The MERGE-PLAN.md file was edited on `chore/docs/announce-test-policy-impl` but the version with updated async test rules never landed on main. Please restore it from that branch, update items 7-10 to `[x] merged to main`, and commit to main.
  Expected output: `docs/_today/MERGE-PLAN.md` on main with all 10 items checked off, committed and pushed.

---

## ✅ Completed This Session (2026-01-14)

- [x] **Cross-Browser Support Infrastructure**
  - [x] CSS Normalization (`src/styles/normalize.css`)
  - [x] Safari/WebKit Fixes (`src/styles/safari-fixes.css`)
  - [x] ResizeObserver Utility (`src/core/resize.js`)
  - [x] Feature Detection (`src/core/features.js`) - No UA sniffing
  - [x] Escape Hatches Documentation (`docs/escape-hatches.md`)
  - [x] Cross-browser test suite (26 tests passing)

- [x] **Playwright Cross-Browser Testing**
  - [x] Firefox project
  - [x] WebKit (Safari) project
  - [x] Mobile Chrome (Pixel 5) project
  - [x] Mobile Safari (iPhone 12) project
  - [x] npm scripts: `test:firefox`, `test:webkit`, `test:mobile`, `test:browsers`

- [x] **VS Code Custom Elements Support**
  - [x] Custom Elements Manifest generator (`scripts/generate-custom-elements.js`)
  - [x] Generated `data/custom-elements.json` (54 components)
  - [x] Added `customElements` field to `package.json`

- [x] **Code Highlighting Fix**
  - [x] Fixed `mdhtml.js` using wrong attributes (`x-pre`/`x-code` → `x-behavior`)

---

## 🔴 High Priority - Architecture

### Builder Module Split (Completed Earlier)
- [x] Split `builder-app/index.js` from 123KB to 26KB (79% reduction)
- [x] Created 7 new modules: panels, dnd, components-core, selection, context-menu, collab, template-add

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

### HTML Parts System ✅ COMPLETED
- [x] `<wb-part>` system with interpolation, conditionals, loops
- [x] Part registry (12 parts defined)
- [x] IntelliSense support
- [x] Documentation

---

## 🔴 High Priority - Test Fixes & Stability

- [ ] **Fix Config Loading Bug** ⚠️ *Causes test failure*
  - Builder properties panel crashes when `propertyconfig.json` missing
  - Add fallback: `fetch(...).catch(() => ({}))`
  - File: `src/builder/builder-properties.js`

- [ ] **Fix Builder Sidebar Tests** ⚠️ *4 tests failing*
  - Workflow overlay (`#wfOverlay`) blocks click events
  - Tests need to dismiss overlay before interacting with sidebar
  - File: `tests/behaviors/ui/builder-sidebar.spec.ts`

- [ ] **Web Components Language Server Issue** 🔍 *Investigate*
  - VS Code shows "no custom element docs found" errors
  - Custom Elements Manifest exists at `data/custom-elements.json` (101KB)
  - May need VS Code restart or extension configuration

---

## 🟡 Medium Priority - Builder Polish

- [ ] **Integrate `builder-drop-handler.js` into `builder.js`**
  - Wire up smart drop handling
  - Connect visual feedback system

- [ ] **Add visual feedback during drag**
  - Implement `getDragFeedback()` calls
  - Show drop zone indicators

- [ ] **Add effects dropdown to property panel**
  - List available modifiers for selected element
  - Allow applying/removing effects

- [ ] **Mobile Testing on Real Devices**
  - Verify responsive fixes work on actual phones
  - Test nav menu toggle, backdrop, scroll lock
  - Check 480px breakpoint on small phones

---

## 🟡 Medium Priority - Native Element Migrations

- [ ] **`progressbar` → native `<progress>`**
  - Use `<progress value="..." max="100">`
  - Maintain existing API/attributes

- [ ] **`search` → native `<search>` wrapper**
  - HTML5 2023 semantic element
  - Wrap existing search functionality

- [ ] **`highlight` → native `<mark>`**
  - Replace custom highlighting with `<mark>` element
  - Preserve styling options

- [ ] **`clock/countdown` → native `<time>`**
  - Use `<time datetime="...">`
  - Add machine-readable timestamps

---

## 🟢 Low Priority - Future Improvements

- [ ] **Production Bundling**
  - Currently 60+ separate JS files
  - Consider esbuild or rollup for single bundle
  - Keep lazy loading benefits

- [ ] **Expand Test Coverage**
  - Current: 26 cross-browser tests + existing suite
  - Target: 100+ tests total
  - Add edge case coverage for behaviors

- [ ] **Performance Profiling**
  - Measure lazy load impact
  - Profile behavior injection time
  - Check memory usage with many behaviors

- [ ] **TypeScript Migration** (gradual)
  - Start with `src/core/` files
  - Add `.d.ts` declarations for behaviors
  - Improves IDE support and catches errors

- [ ] **Schema Coverage**
  - Currently ~80% of behaviors have schemas
  - Missing: some layout and effect behaviors
  - Target: 100% for builder compatibility

- [ ] **Split Remaining Large Files** (if needed)
  - `builder-template-browser.js` (75KB) → 3-4 modules
  - `builder-templates.js` (75KB) → template data, rendering
  - `builder-editing.js` (56KB) → 2-3 modules
  - `builder-tree.js` (41KB) → tree view, selection

---

## 🧪 Test Commands

```bash
# Standard tests
npm test                  # Full test suite
npm run test:compliance   # Static compliance only
npm run test:behaviors    # Behavior tests

# Cross-browser tests
npm run test:firefox      # Firefox
npm run test:webkit       # Safari/WebKit
npm run test:mobile       # Mobile Chrome + Safari
npm run test:browsers     # All browsers

# Utilities
npm run test:ui           # Playwright UI mode
npm run test:single       # Single-threaded (debugging)
```

---

## 📊 Current Test Status

| Suite | Status |
|-------|--------|
| Compliance | ✅ Passing |
| Cross-browser Support | ✅ 26/26 passing |
| Base Behaviors | ✅ Passing |
| Builder Sidebar | ⚠️ 4 failing (overlay issue) |

---

## Quick Reference

```bash
npm start                           # http://localhost:3000
node scripts/generate-custom-elements.js  # Regenerate CEM
```

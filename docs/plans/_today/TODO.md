# TODO List (2026)

**Last Updated:** 2026-01-17  
**Source:** ./CURRENT-STATUS.md

---

## ✅ Completed This Session

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

## 🔴 High Priority – Architecture

### Builder Module Split (Completed Earlier)
- [x] Split `builder-app/index.js` from 123KB to 26KB (79% reduction)
- [x] Created 7 new modules: panels, dnd, components-core, selection, context-menu, collab, template-add

### x- Prefix Migration
- [x] **Phase 1: Core Infrastructure** ✅ COMPLETED 2026-01-21
  - [x] Update `src/core/wb.js` - add custom element + x-* scanning
  - [x] Create `src/core/tag-map.js` - tag-to-behavior mapping (100+ components)
  - [x] Create `src/core/extensions.js` - extension behavior registry (60+ decorations, 29 morphs)
  - [x] Unit tests: `tests/compliance/tag-map.spec.ts` (31 tests)
  - [x] Unit tests: `tests/compliance/extensions.spec.ts` (46 tests)
- [x] **Phase 2: Behaviors** - Update attribute names (title→heading, type→variant) ✅ COMPLETED 2026-01-22
  - [x] `feedback.js` toast: `type` → `variant` (with legacy fallback)
  - [x] `tabs.js`: `title` → `label` (with legacy fallback)
  - [x] Event details updated with legacy aliases
  - [x] See `docs/plans/PHASE2-ATTRIBUTE-MIGRATION.md`
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

## 🔴 High Priority – Test Fixes & Stability

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

## 🟡 Medium Priority – Builder Polish

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

## 🟡 Medium Priority – Native Element Migrations

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

## 🟡 Medium Priority – UI Enhancements

- [ ] **Navbar Active Page Highlight** (Code Added - Needs Testing)
  - Added `activeStyle` property: none, color, underline, pill, arrow, dot, glow
  - Added `activeColor` property for custom highlight color
  - Files: `propertyconfig.json`, `navbar.schema.json`, `navbar.css`, `premium-navbar.js`
  - Needs browser testing to verify all 7 styles work correctly

---

## 🟢 Low Priority – Future Improvements

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

---

## References

- See docs/builder/pages.md for schema-driven page builder rules
- See docs/builder/builder-workflow.md for workflow system
- See docs/builder/builder-properties.md for properties panel
- See docs/builder/builder-interaction-rules.md for interaction rules
- See docs/plans/MVVM-MIGRATION.md for migration and architecture
- See docs/PAGE-BUILDER-RULES.md for content rules

```bash
npm start                           # http://localhost:3000
node scripts/generate-custom-elements.js  # Regenerate CEM
```

# TODO List

**Created**: 2024-12-31
**Source**: CURRENT-STATUS.md

---

## 🔴 High Priority - Architecture

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

### HTML Parts System (ONE-TIME-ONE-PLACE for markup) ✅ COMPLETED
- [x] **Design `<wb-part>` system** - `src/core/wb-parts.js`
  - Define once: `<template wb-part="card-tile">...</template>`
  - Use anywhere: `<wb-part card-tile icon="📝" label="Card">`
  - Interpolation: `{{prop}}`, `{{prop || default}}`, ternary
  - Conditionals: `wb-if`, `wb-unless`
  - Loops: `wb-for="item in items"`
- [x] **Part registry** - `src/parts/parts-registry.json` (12 parts defined)
- [x] **Part slots** - `{{body}}` placeholder for inner content
- [x] **Part variants** - Via attributes (variant, size, status enums)
- [x] **Data binding** - `src="/api/data"` fetches JSON, `refresh="5000"` auto-refresh
- [x] **IntelliSense** - `.vscode/html-custom-data.json` updated
- [x] **Documentation** - `docs/architecture/WBPARTS.md`

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
  - Add: `await page.click('[data-dismiss]')` or close overlay programmatically

- [ ] **AI Code Regression Audit**
  - Run full `npm test` suite
  - Review `git diff` for unintended changes
  - Check core files (wb.js, site-engine.js, behaviors) for regressions
  - Document any found issues

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
  - Verify Jan 3 responsive fixes work on actual phones
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
  - Current: 44 tests (89% passing)
  - Target: 60+ tests
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

---

## ✅ Completed This Session

- [x] Mobile Responsive Fixes (Jan 3)
- [x] Web Behaviors (WB).js Internals Documentation (`docs/architecture/wb_internals.md`)
- [x] **Attribute Naming Standard** (`docs/architecture/ATTRIBUTE-NAMING-STANDARD.md`)
  - Custom element naming: `<component-name>`, `x-behavior`, `x-as-morph`
  - Native attribute reuse rule
  - Collision avoidance (`title` → `heading`, `type` → `variant`)
  - Data injection patterns
- [x] **Migration Plan for x- Prefix** (`docs/architecture/MIGRATION-PLAN-X-PREFIX.md`)
  - Custom elements (IS-A): `<basic-card>`
  - Extensions (HAS-A): `x-ripple`, `x-tooltip="tip"`
  - Morphing (BECOMES): `x-as-card`
  - Multiple behaviors solved: each `x-*` is independent attribute
- [x] **Builder Sidebar Common Components** (`src/builder/builder-sidebar.js`)
  - Added 12 common component tiles (4x3 grid)
  - Click to add OR drag to canvas
  - Visual tile design with icons
- [x] Builder Sidebar Category System
- [x] Builder Architecture Refactor (event hygiene)
- [x] `autocomplete` → native `<datalist>`
- [x] Created `src/behaviorMeta.js` (155+ behaviors)
- [x] Created `src/builder-drop-handler.js`

---

## Quick Reference

```bash
npm start    # http://localhost:3000/builder.html
npm test     # Run tests
```

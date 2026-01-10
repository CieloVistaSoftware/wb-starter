# Current Status - Web Behaviors (WB) Starter

**Last Updated:** 2026-01-06

---

## ✅ MIGRATION COMPLETE: data-wb → Custom Elements

**Migration Date:** 2026-01-06

### Migration Summary

```
📊 MIGRATION SUMMARY
Files processed: 23
Files modified: 19
Components converted: 178
Behaviors converted: 24
Properties renamed: 2 (align → xalign)
```

### What Was Migrated

All `data-wb="..."` attributes have been converted to:
- **Components**: `<wb-*>` custom element tags
- **Behaviors**: `x-*` attributes

| Before (Legacy) | After (v3.0) |
|-----------------|--------------|
| `<div data-wb="card">` | `<wb-card>` |
| `<div data-wb="badge">` | `<wb-badge>` |
| `<button data-wb="ripple">` | `<button x-ripple>` |
| `data-title="Hello"` | `title="Hello"` |
| `align="center"` | `xalign="center"` |

### Files Migrated

- `pages/about.html`
- `pages/components.html`
- `pages/contact.html`
- `pages/docs.html`
- `pages/features.html`
- `pages/home.html`
- `demos/autoinject.html`
- `demos/behaviors.html`
- `demos/card.html`
- `demos/code.html`
- `demos/frameworks.html`
- `demos/kitchen-sink.html`
- `demos/mdhtml-debug.html`
- `demos/mdhtml-pre-debug.html`
- `demos/semantics-forms.html`
- `demos/semantics-media.html`
- `demos/semantics-structure.html`
- `demos/semantics-theme.html`
- `tests/views/card-schema-test.html`

---

## ✅ v3.0 Standards Documented

**Created:** `docs/standards/V3-STANDARDS.md`

### Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│  WB v3.0 SYNTAX CHEAT SHEET                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  COMPONENTS (custom elements)                           │
│  ─────────────────────────────                          │
│  <wb-card title="..." variant="glass">                  │
│  <wb-modal id="my-modal">                               │
│  <wb-badge variant="success">                           │
│  <wb-cardhero xalign="center">                          │
│                                                         │
│  BEHAVIORS (attribute on existing elements)             │
│  ─────────────────────────────────────────              │
│  <button x-ripple>                                      │
│  <span x-tooltip="Tip text">                            │
│  <div x-animate="fadeIn">                               │
│  <header x-sticky>                                      │
│                                                         │
│  PROPERTIES (clean names, no prefix)                    │
│  ─────────────────────────────────────                  │
│  title="Hello"          ✓ CORRECT                       │
│  variant="glass"        ✓ CORRECT                       │
│  xalign="center"        ✓ CORRECT                       │
│  data-title="Hello"     ✗ WRONG (legacy)                │
│                                                         │
│  FILE STRUCTURE                                         │
│  ──────────────                                         │
│  Schema:   src/wb-models/{name}.schema.json             │
│  Behavior: src/wb-viewmodels/{name}.js                  │
│  Style:    src/styles/components/{name}.css             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Builder Header Default Fixed

**Updated:** `src/builder/builder-template-browser.js`, `src/builder/builder-canvas-sections.js`

### Changes Made

1. **Canvas defaults to Header section** as the active (green) target
2. **Template browser Header section** is expanded by default
3. **Main and Footer sections** are collapsed by default
4. **Event sync** between canvas and template browser

When the builder opens:
- Canvas shows Header/Main/Footer structure
- Header section is green (is-target class)
- Template browser Header section is expanded with navigation templates visible

---

## ✅ RELEASED: WB Framework v3.0

**Release Date:** 2026-01-05

### What's New in v3.0

- **MVVM Schema Builder** integrated into `WB.init()`
- **DOM generation** from `$view` schema definitions
- **54 component schemas** converted to v3.0 format
- **Automatic processing** of `<wb-*>` custom element tags
- **$methods binding** support for component APIs
- **$cssAPI** documentation for theming

### v3.0 Syntax Strategy

| Syntax | Use Case | Example | Status |
|--------|----------|---------|--------|
| `<wb-card>` | Component tags | `<wb-card title="Hello">` | ✅ PRIMARY |
| `x-ripple` | Add behaviors | `<button x-ripple>` | ✅ PRIMARY |
| `data-wb="card"` | Legacy fallback | `<div data-wb="card">` | ⚠️ DEPRECATED |

---

## Test Results

**Latest Run:** 40 passed, 11 failed

### Pre-existing Failures (Not Migration Related)

1. **Schema compliance** - Missing `$cssAPI` sections (3 schemas)
2. **Duplicate variables** - card.js has 13 duplicate declarations
3. **Card-schema tests** - beforeEach timeout (WB not initializing)
4. **Functional runner** - No schemas with functional tests found

### Tests Passing

- Schema validation: ✓
- Dark mode compliance: ✓
- HTML IDs compliance: ✓
- Behavior validation: ✓
- Views registry: ✓
- Source-schema coverage: 54/55 matched

---

## Migration Scripts Created

| Script | Purpose |
|--------|---------|
| `scripts/find-data-wb-artifacts.js` | Scan HTML files for legacy data-wb usage |
| `scripts/migrate-data-wb.js` | Auto-migrate data-wb to custom elements |

### Usage

```bash
# Find all legacy data-wb usage
npm exec -- node scripts/find-data-wb-artifacts.js

# Preview migration (dry run)
npm exec -- node scripts/migrate-data-wb.js --dry-run

# Run migration
npm exec -- node scripts/migrate-data-wb.js
```

---

## Next Steps (Priority Order)

### 1. ✅ data-wb Migration - COMPLETE
- 178 components converted
- 24 behaviors converted
- 2 properties renamed

### 2. 🔴 MVVM Structure Cleanup (HIGH PRIORITY)
- **Goal:** Consolidate src/ into proper MVVM pattern
- **Tasks:**
  - Move `src/builder/` (19 files) → `src/wb-viewmodels/builder/`
  - Move `src/builder.js` → `src/wb-viewmodels/builder/`
  - Merge `src/behaviors/index.js` registry into `src/core/`
  - Archive empty folders: `src/behaviors/css/`, `src/behaviors/html/`, `src/behaviors/js/`
  - Evaluate `src/wb-views/` - views are in schemas as `$view`, may not need separate folder
  - Update all import paths after moves
  - Test that everything still works
- **Archive to:** `/archive/cleanup-2026-01-07/`

### 3. 🔵 Root Directory Cleanup (BACKGROUND TASK)
- **Status:** In progress (background)
- **Coordination:** `/Lock` folder for multi-AI file locking
- **Tasks:**
  - Clean up temp/debug files (debug_behaviors.js, repro_*.js, temp_check.js)
  - Merge documentation where needed
  - Archive uncertain files to `/archive/cleanup-2026-01-06/`
  - Update .gitignore for generated files
- **Goal:** Neat, clean root directory
- **See:** `/Lock/lock.md` for AI coordination protocol

### 4. Fix Pre-existing Test Failures 🟡
- Add `$cssAPI` to card.schema.json, cardprofile.schema.json, demo.schema.json
- Fix duplicate variable declarations in card.js
- Fix card-schema test timeout

### 5. XSS Security Hardening 🟡
| Task | Status |
|------|--------|
| Triple-mustache (`{{{raw}}}` vs `{{escaped}}`) | Pending |
| Add DOMPurify sanitization | Pending |
| Document CSP recommendations | Pending |

### 6. IDE Intellisense Generation 🟡
- Create `scripts/generate-css-intellisense.js`
- Read `$cssAPI` from all schemas
- Generate `.vscode/css-custom-data.json`

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `docs/standards/V3-STANDARDS.md` | v3.0 naming conventions and API |
| `docs/architecture/SCHEMA-SPECIFICATION.md` | Complete v3.0 spec |
| `docs/architecture/ATTRIBUTE-NAMING-STANDARD.md` | Attribute naming rules |
| `src/wb-models/*.schema.json` | All 54 component schemas |

---

## Session History (Jan 7)

### Afternoon Session
- **Properties Panel Selected Element Indicator**: Added green-bordered indicator at top of properties panel showing:
  - Selected element ID (e.g., `#hero-1`)
  - Which section the element is in (Header/Main/Footer)
  - Hint that color palette applies to this element
- **Preview Mode Theme Inheritance**: Preview now properly inherits the page theme instead of forcing white background
  - Added `setPageTheme(theme)` and `getPageTheme()` API functions
  - Preview mode applies page theme, then restores builder theme on exit
  - Workspaces save/load page theme separately from builder theme
- **Preview Mode Vertical Scrolling**: Added `overflow-y: auto` to preview mode viewport
- **ID Labels Hidden in Preview**: Component ID labels (.el-id-label) now hidden in preview mode
- **Updated builder.schema.json**: Added comprehensive specs for:
  - `canvasSections` rules (collapsed on load, toggle, IDs visible, scroll offset)
  - `selection` rules (section click immediate focus)
  - `sectionFocus` rules (green section = color palette works)
  - `propertiesPanel` rules (selected element indicator)
  - `previewMode` rules (theme inheritance, vertical scroll, expands collapsed)
  - New events: `wb:canvas:section:toggled`
  - New API: `toggleCanvasSection()`
  - Updated functional tests for all new behaviors

### Morning Session
- Fixed canvas section collapse behavior: Header/Main/Footer now show as collapsed stacked bars by default
- Clicking any section header (in canvas, tree, or template browser) toggles expand/collapse
- State syncs between canvas, component tree, and template browser
- When clicking Footer (or any section), canvas scrolls to show it 5rem below the builder header
- Removed "click to add" badges and empty state messages from canvas sections
- Moved component counter from header to component tree panel
- Added visible IDs to canvas sections (#canvas-header, #canvas-main, #canvas-footer)
- Added readable component IDs (e.g., sidebarLeft-1, column2-1, hero-1) that auto-increment
- Component IDs now display as purple labels in top-left corner of each dropped element

## Session History (Jan 6)

### Evening Session
- Fixed template browser: All sections (Header/Main/Footer) collapsed by default
- Removed filter hint that showed incorrectly
- Added `setTargetSection()` function to builder.html
- Clicking section header in template browser now activates canvas section (green)
- Removed auto-activation of header on init
- Updated builder.todo.md with Phase 6 fixes
- Updated builder-properties.md documentation

### Morning Session
- Created `scripts/find-data-wb-artifacts.js` - Found 489 legacy instances
- Created `scripts/migrate-data-wb.js` - Auto-migration tool
- Ran migration: 178 components, 24 behaviors converted
- Created `docs/standards/V3-STANDARDS.md` - Complete API documentation
- Fixed builder to default to header section expanded and green
- Updated CURRENT-STATUS.md with migration results

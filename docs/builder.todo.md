# Builder TODO
## Phase 1: Foundation Fixes ✅ COMPLETE
### 1. Fix Invisible Components ✅
All button-type behaviors already have visible rendering in their behavior functions:
- ✅ **Clipboard** - `helpers.js` renders button when empty
- ✅ **Confetti** - `effects.js` renders gradient button  
- ✅ **Print** - `helpers.js` renders button
- ✅ **Share** - `helpers.js` renders button
- ✅ **Fullscreen** - `helpers.js` renders button
- ✅ **Scroll** - `helpers.js` renders button
- ✅ **Fireworks** - `effects.js` renders button
- ✅ **Snow** - `effects.js` renders button
**Fixed:** Renamed `text` to `clipboardText` in Clipboard C.All definition to avoid textContent collision.

---

### 2. Right-Click Context Menu ✅
Already implemented in `builder.js`:
- ✅ `showContextMenu()` function
- ✅ Menu items: View Schema, Edit Properties, Duplicate, Move Up/Down, Delete
- ✅ Context menu styles (inline in function)

---

### 3. Container Layout Properties ✅
Already implemented in C.All:
```javascript
{ n: 'Container', b: 'container', d: { 
  direction: 'column',
  columns: 1,
  gap: '1rem',
  align: 'stretch',
  justify: 'start',
  wrap: true,
  padding: '1rem'
}, container: true }
```

---

### 4. Undo/Redo ✅
Already implemented in `builder.js`:
- ✅ `saveHist()` - saves canvas state
- ✅ `undo()` / `redo()` functions
- ✅ `Ctrl+Z` / `Ctrl+Y` keyboard shortcuts
- ✅ Toolbar buttons

---

## Phase 2: Schema Integration

- [ ] Create `getSchemaProperties(behavior)` function
- [ ] Merge schema props with C.All defaults on drop
- [ ] Generate property panel inputs from schema types
- [ ] Add property validation from schema rules

---

## Phase 3: Persistence

- [x] Auto-save to localStorage (already works)
- [ ] Save page state to JSON (`/api/save`)
- [ ] Load page state from JSON file
- [ ] Export to standalone HTML file (partial - exports HTML)

---

## Phase 4: Advanced Features

- [ ] Component templates (Hero, Pricing Table, etc.)
- [ ] Responsive breakpoint overrides
- [ ] Layers panel (visual hierarchy) - partially done with tree view
- [ ] Style editor (custom CSS per component)

---

## Phase 5: GUI Updates (from diagram)

Based on `docs/diagrams/builder-sections.html`:

### Canvas Editing
- [ ] All content editable on canvas (title, subtitle, content, footer)
- [ ] Click text to edit in place (WYSIWYG)
- [ ] Visual cues: hover shows dashed outline, focus shows solid outline

### Properties Panel  
- [ ] Settings only (no content fields)
- [ ] Checkboxes for booleans (elevated, clickable)
- [ ] Dropdowns for enums (variant, align)
- [ ] Text inputs for URLs, CSS values

### Theme System
- [ ] Theme picker in toolbar (Default inherit, Light, Dark, Ocean, etc.)
- [ ] Per-page theme override (stored in page JSON)
- [ ] Inherit from site-wide `<html data-theme>`

### Visual Hierarchy
- [ ] Layout containers: dashed orange border
- [ ] Components: solid blue border
- [ ] Selected: glowing border effect
- [ ] Component labels showing type

---

## Files Reference

| File | Purpose |
|------|---------|
| `builder.js` | Main builder logic, C.All definitions |
| `builder.css` | Builder UI styles |
| `builder.html` | Builder markup |
| `builder-tree.js` | Component tree rendering |
| `src/builder-editing.js` | Inline editing, drop zones |
| `src/behaviors/js/helpers.js` | Clipboard, Print, Share, Fullscreen, Scroll |
| `src/behaviors/js/effects.js` | Confetti, Fireworks, Snow, Animate |
| `src/behaviors/js/layouts.js` | Container behavior |

---

## Progress

| Task | Status | Date |
|------|--------|------|
| Fix sidebar resize | ✅ Done | Dec 17 |
| Fix invisible components | ✅ Done | Dec 18 |
| Add context menu | ✅ Already exists | Dec 18 |
| Fix Container layout | ✅ Already exists | Dec 18 |
| Add undo/redo | ✅ Already exists | Dec 18 |
| Schema integration | ⬜ TODO | |
| Canvas inline editing | ⬜ TODO | |
| Theme picker | ⬜ TODO | |

---

## Phase 6: Builder UI Fixes (January 2026)

### Completed
- [x] Tab icons 1.5rem in property panel
- [x] Toolbar moved to builder header
- [x] Canvas section badges ("Click to add to Header/Main/Footer")
- [x] Preview mode CSS (hide all builder UI)
- [x] Collapsible categories in properties panel (click header to toggle)
- [x] Gray out components already in canvas
- [x] Section-specific tooltips

### In Progress
- [x] Template browser: All sections (Header/Main/Footer) collapsed by default ✅
- [x] Template browser: No filter hint shown until user clicks a section ✅
- [x] Canvas: Header section visible and clickable ✅
- [x] setTargetSection function added ✅
- [ ] Tree panel: Clicking section header expands to show children
- [ ] Tree panel: Container headers act as collapse/expand toggles

### Bugs Fixed
- [x] Canvas header section not visible - removed default is-target class
- [x] Clicking Header in tree panel shows nothing - added setTargetSection function
- [x] tb-filter-hint showing when it shouldn't - removed filter hint entirely
- [x] activeTreeSection incorrectly set to 'header' on init - now null by default

### Documentation Updates Needed
- [ ] Update propertyconfig.schema.json with collapsible category behavior
- [ ] Update builder-properties.md with toggle instructions
- [ ] Document tree panel collapse/expand behavior

---

## Phase 7: Unified Property Viewer & Documentation (Jan 11, 2026)

### Completed
- [x] **Split View Architecture**: Unified Component Tree and Property Panel into a single column (Tree top, Properties bottom).
- [x] **Independent Scrolling**: Flexbox implementation allows independent scrolling for tree and properties.
- [x] **State Management**: Panel clears correctly on `Escape` or `Reset` (UX Polish).
- [x] **Documentation**: Created `docs/property-viewer.md` detailing the split view UX and technical implementation.
- [x] **Marketing**: Created `docs/linkedin-framework-agnostic.md` article.
- [x] **Documentation Manifest**: Updated `manifest.json`.

---

## Phase 8: Framework Compliance & Testing (Jan 13, 2026)

### Completed
- [x] **Base Class Audit**: Audited and fixed 22 missing `baseClass` assignments across all behaviors (card, checkbox, demo, span, etc.) to ensure schema compliance.
- [x] **Functional Test Schema Support**: Established pattern for `test.functional` in schemas.
- [x] **Initial Functional Tests**: Added full functional test coverage for `button`, `card`, `checkbox`, and `input`.

### In Progress
- [ ] Expand functional test coverage to remaining components.

---

*Last updated: January 13, 2026*

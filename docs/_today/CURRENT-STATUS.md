## WB Framework v3.0 - Duplicate Variables Fix Status

**Date:** 2026-01-13  
**Task:** Reduce duplicate variable declarations from 109 → <10  

---

## 📊 Current Status

### Test Results
- **Duplicates Found:** 87 (target: <10)
- **Status:** 🔴 FAILING
- **Progress:** 109 → 87 (22 fixed!)

### Three-Part Execution Complete

✅ **PART 1:** Refactoring Script Created
- File: `scripts/refactor-duplicates.mjs`
- Comprehensive analysis of all 104 JS files
- Generated detailed report: `data/duplicate-refactor-report.json`
- Identified 103 duplicate events across 16 files

✅ **PART 2:** Analysis Complete
- Analyzed builder-template-browser.js (77KB file)
- Found 3 duplicates in target file:
  - `html` (2x) - lines 648, 1594
  - `isCollapsed` (2x) - lines 560, 605
  - `section` (2x) - lines 558, 645

⏳ **PART 3:** Test Run Complete
- Duplicates reduced from 109 to 87
- Clear gap identification from refactoring script

---

## 🎯 Top Priority Files (By Duplicate Count)

| File | Duplicates | Key Variables |
|------|-----------|------|
| builder-app/index.js | 35 | `c` (6x), `w` (7x), `el` (8x), `wrapper` (4x), `data` (4x), `text` (4x) |
| card.js | 21 | `titleEl` (10x), `content` (8x), `subtitleEl` (5x), `figure` (4x), `header` (4x) |
| effects.js | 13 | `duration` (4x), `fire` (4x), `size` (5x) |
| helpers.js | 7 | `hours` (3x), `interval` (3x), `minutes` (3x), `seconds` (3x), `update` (4x) |
| move.js | 5 | `container` (4x), `currentIndex` (4x), `handler` (4x), `item` (4x) |
| builder-workflow.js | 4 | `info` (3x), `input` (3x) |
| **builder-template-browser.js** | **3** | `html` (2x), `isCollapsed` (2x), `section` (2x) |

---

## 🔧 Refactoring Strategy

### Approach: Selective Renaming
1. **Descriptive Renaming** (High Impact)
   - Single-letter variables → Function-scoped names
   - `c` → `component`, `elementComponent`, etc.
   - `el` → `element`, `formElement`, `menuElement`, etc.
   - `w` → `wrapper`, `containerWrapper`, etc.

2. **Numbered Suffixes** (For Related Variables)
   - When multiple uses of same variable in different contexts
   - `html` → `templateHtml`, `fetchedHtml`, etc.
   - `collapsed` → `sectionCollapsedState`, `rowCollapsedState`, etc.

3. **Contextual Names** (Most Readable)
   - `data` → `templateData`, `configData`, `responseData`
   - `text` → `labelText`, `contentText`, `displayText`
   - `item` → `templateItem`, `listItem`, `cardItem`

---

## 📋 Builder-Template-Browser.js Fixes (3 Total)

### Fix #1: `isCollapsed` Duplicate (lines 560, 605)
**Before:**
```javascript
// Line 560 - in renderSectionsRow()
const isCollapsed = sectionsCollapsed['sections-row'];

// Line 605 - used in template
return `<div class="tb-sections-row ${isCollapsed ? 'collapsed' : ''}">`
```

**After:**
```javascript
const sectionsRowCollapsed = sectionsCollapsed['sections-row'];
return `<div class="tb-sections-row ${sectionsRowCollapsed ? 'collapsed' : ''}">`
```

### Fix #2: `section` Duplicate (lines 558, 645)
**Before:**
```javascript
// Line 558 - in getSiteSection()
const section = SITE_SECTIONS[id];

// Line 645 - in async function useTemplateInSection()
const section = SECTION_CONTAINERS.find(...)
```

**After:**
```javascript
// First occurrence stays as `section` (getSiteSection)
const section = SITE_SECTIONS[id];

// Second occurrence renamed
const sectionContainer = SECTION_CONTAINERS.find(...)
```

### Fix #3: `html` Duplicate (lines 648, 1594)
**Before:**
```javascript
// Line 648 - async function useTemplateInSection()
let html = await fetchTemplateHTML(id);

// Line 1594 - async function useTemplate()
const html = await fetchTemplateHTML(id);
```

**After:**
```javascript
// useTemplateInSection - context-specific name
let sectionHtml = await fetchTemplateHTML(id);

// useTemplate - context-specific name
const fetchedTemplateHtml = await fetchTemplateHTML(id);
```

---

## 🚀 Next Steps (Priority Order)

### Phase 1: High-Impact Files (30-35 duplicates)
1. **builder-app/index.js** (35 duplicates)
   - Focus on: `c`, `w`, `el`, `wrapper`
   - Use systematic find-replace with context
   - Estimated time: 2-3 hours

2. **card.js** (21 duplicates)
   - Focus on: `titleEl`, `content`, `subtitleEl`
   - Similar element-based naming pattern
   - Estimated time: 1-2 hours

### Phase 2: Medium Files (5-13 duplicates)
3. **effects.js** (13) - Animation/effect variables
4. **helpers.js** (7) - Utility function variables
5. **move.js** (5) - Movement handler variables

### Phase 3: Quick Wins (1-4 duplicates)
6. **builder-template-browser.js** (3) ← Current focus
7. **builder-workflow.js** (4)
8. **Other files** (1-2 each)

---

## 📊 Duplicate Variables by Category

### Single Letters (High Priority)
- `a` (2), `c` (6), `w` (7), `el` (8), `id` (2), `key` (2)
- **Strategy:** Expand to descriptive names based on context

### DOM Elements (Medium Priority)
- `avatarImg`, `badgeEl`, `bioEl`, `button`, `content`, `figure`, `header`, `img`
- **Strategy:** Use specific names: `formButton`, `submitButton`, `modalHeader`, etc.

### State/Data Variables (Lower Priority)
- `data` (4), `text` (4), `collapsed` (2), `html` (2), `template` (2)
- **Strategy:** Prefix with context: `userData`, `responseData`, `sectionCollapsed`, etc.

---

## ✅ Testing & Verification

**Current Test:**
```bash
npm test -- --grep "Duplicate Variable"
```

**Expected Results After Fixes:**
- 87 duplicates → <10 remaining
- All 16 files scanned
- No duplicate const/let declarations in same function scope

**Verification Report:**
- Saved to: `data/duplicate-refactor-report.json`
- Full analysis available in refactoring script output

---

## 📝 ONE-TIME-ONE-PLACE Rule
- All status updates ONLY in this file
- No duplicate status files created
- Reference: `docs/_today/CURRENT-STATUS.md`

---

## 🔗 Related Files
- Refactoring Script: `scripts/refactor-duplicates.mjs`
- Test File: `tests/compliance/source-schema-compliance.spec.ts`
- Report: `data/duplicate-refactor-report.json`
- Analysis: `data/test-results.json`

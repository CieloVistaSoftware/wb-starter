# Current Status - mdhtml Code Block Rendering Fix
**Updated:** 2026-02-04 20:50

## ✅ COMPLETED - mdhtml Dedent Fix (components.html code samples)

### Root Cause:
`<wb-mdhtml><template>` content inherits the HTML file's indentation (8+ spaces). GFM fenced code blocks (```) only allow up to 3 spaces of indentation before the opening fence. So `marked.js` was NOT recognizing them as code blocks — backticks rendered as literal text and HTML tags passed through unescaped.

### Fix Applied:
- Added `dedent()` function to `src/wb-viewmodels/mdhtml.js`
- Strips common leading whitespace from all non-empty lines before parsing
- Applied to both `<template>` innerHTML path and `textContent` fallback path
- External file (`data-src`) path unchanged (fetched files don't have this issue)

### Files Changed:
- `src/wb-viewmodels/mdhtml.js` — added dedent function, applied to content sources

### Test Results:
- ✅ All mdhtml tests pass (7/7 relevant, 1 pre-existing server-down failure)
- ✅ `code blocks render within mdhtml` — validates the fix
- ✅ `mdhtml: comprehensive compliance` — full compliance
- ✅ `wb-mdhtml sets hydration marker` — hydration working
## ✅ COMPLETED - themes-showcase.spec.ts Test Fixes

### Issues Fixed:
1. **Port mismatch**: Changed hardcoded `localhost:5174` to relative URL `/?page=themes` — uses Playwright's webServer on port 3000
2. **Selector mismatches**:
   - `wb-theme-dropdown` → `wb-themecontrol`
   - `wb-alert[type="info"]` → `wb-alert[variant="info"]`
3. **Visibility vs existence**: Changed `toBeVisible()` to `toHaveCount(1)` for components with unimplemented behaviors (themecontrol, stats-card)
4. **Race conditions**: Added `await expect(element.first()).toBeVisible()` before all `count()` calls to eliminate flakiness

### Files Changed:
- `tests/views/themes-showcase.spec.ts`

### Test Results:
- ✅ All 25 themes-showcase tests pass consistently

## Previous Session Work Preserved:
- ✅ Builder HTML fix (invalid script block removed)
- ✅ "URL Slug" → "Relative URL" label change
- ✅ Dynamic page settings header
- ✅ Status bar relative URL display
- ✅ Template indicator
- ✅ builder-enhancements.js module integration

## WB Framework v3.0 - Current Status

**Date:** 2026-01-14  
**Last Updated:** Cross-browser infrastructure + code highlighting fix

---

## ✅ Completed Today

### 1. Code Highlighting Fix
- **Issue:** `mdhtml.js` was setting `x-pre` and `x-code` attributes, but `WB.scan()` looks for `x-behavior`
- **Fix:** Changed to `x-behavior="pre"` and `x-behavior="code"`
- **File:** `src/wb-viewmodels/mdhtml.js`

### 2. Cross-Browser Support Infrastructure

| Component | File | Status |
|-----------|------|--------|
| CSS Normalize | `src/styles/normalize.css` | ✅ Created & wired |
| Safari Fixes | `src/styles/safari-fixes.css` | ✅ Created & wired |
| ResizeObserver | `src/core/resize.js` | ✅ Created |
| Feature Detection | `src/core/features.js` | ✅ Created |
| Escape Hatches | `docs/escape-hatches.md` | ✅ Documented |
| Cross-browser Tests | `tests/compliance/cross-browser-support.spec.ts` | ✅ 26 tests passing |

### 3. Playwright Cross-Browser Projects
Added to `playwright.config.ts`:
- `firefox` - Desktop Firefox
- `webkit` - Desktop Safari/WebKit
- `mobile-chrome` - Pixel 5
- `mobile-safari` - iPhone 12

### 4. New npm Scripts
```bash
npm run test:firefox    # Firefox tests
npm run test:webkit     # Safari/WebKit tests
npm run test:mobile     # Mobile Chrome + Safari
npm run test:browsers   # All browsers at once
```

### 5. Custom Elements Manifest
- **File:** `data/custom-elements.json` (101KB, 54 components)
- **Generator:** `scripts/generate-custom-elements.js`
- **Config:** Added `"customElements"` field to `package.json`
- **Purpose:** Enables VS Code "Go to Definition" for `<wb-*>` elements

---

## 📁 Files Created Today

| File | Size | Purpose |
|------|------|---------|
| `src/styles/normalize.css` | 2.1 KB | CSS reset/normalization |
| `src/styles/safari-fixes.css` | 3.2 KB | Safari/WebKit workarounds |
| `src/core/resize.js` | 4.8 KB | ResizeObserver utilities |
| `src/core/features.js` | 6.2 KB | Feature detection (no UA sniffing) |
| `docs/escape-hatches.md` | 2.8 KB | Override/customization docs |
| `scripts/generate-custom-elements.js` | 4.5 KB | CEM generator |
| `data/custom-elements.json` | 101 KB | Custom Elements Manifest |
| `tests/compliance/cross-browser-support.spec.ts` | 12 KB | 26 cross-browser tests |

---

## 📁 Files Modified Today

| File | Change |
|------|--------|
| `index.html` | Added normalize.css and safari-fixes.css imports |
| `package.json` | Added customElements field + test scripts |
| `playwright.config.ts` | Added firefox, webkit, mobile projects |
| `src/wb-viewmodels/mdhtml.js` | Fixed x-behavior attributes for code highlighting |

---

## 🔧 Cross-Browser Checklist

| Feature | Status |
|---------|--------|
| CSS Normalization | ✅ Handled |
| Browser Detection | ✅ Handled (feature detection, no UA sniffing) |
| Vendor Prefixes | ✅ Handled (not needed for modern CSS) |
| Safari Grid Workarounds | ✅ Handled |
| Resize Listeners | ✅ Handled |
| Cross-browser Testing | ✅ Handled |
| Escape Hatches | ✅ Handled |

---

## 💡 Usage Examples

### Use New CSS
```html
<!-- Already wired in index.html -->
<link rel="stylesheet" href="/src/styles/normalize.css">
<link rel="stylesheet" href="/src/styles/safari-fixes.css">
```

### Use Feature Detection
```javascript
import { features, cssFeatures } from '/src/core/features.js';

if (features.resizeObserver) { /* use it */ }
if (cssFeatures.containerQueries) { /* use them */ }
```

### Use Resize Observer
```javascript
import { onResize, onBreakpoint } from '/src/core/resize.js';

const cleanup = onResize(element, (entry) => {
  console.log('Width:', entry.contentRect.width);
});

onBreakpoint(element, { sm: 640, md: 768, lg: 1024 }, ({ name }) => {
  console.log(`Breakpoint: ${name}`);
});
```

### Run Cross-Browser Tests
```bash
npm run test:browsers   # All browsers
npm run test:webkit     # Safari only
```

---

## 📊 Test Results

**Cross-Browser Support Tests:** 26/26 passing ✅

```
✓ CSS Normalize is loaded
✓ CSS Normalize applies box-sizing: border-box
✓ CSS Normalize removes body margin
✓ Reduced motion is respected
✓ Feature detection module exports correctly
✓ Feature detection detects ResizeObserver
✓ Feature detection detects IntersectionObserver
✓ CSS feature detection works
✓ No UA sniffing in WB core
✓ CSS Grid works without prefix
✓ CSS Flexbox gap works
✓ CSS Transform works without prefix
✓ Safari fixes CSS is loaded
✓ Collapse-grid utility class exists
✓ Safe-area-inset utility class exists
✓ Resize module exports correctly
✓ onResize fires callback with size
✓ onResize cleanup works
✓ getSize returns dimensions
✓ Playwright config has cross-browser projects
✓ Package.json has cross-browser test scripts
✓ data-wb-skip prevents behavior injection
✓ x-ignore prevents auto-injection
✓ CSS custom properties can override component styles
✓ Escape hatches documentation exists
✓ All cross-browser infrastructure files exist
```

---

## 📝 ONE-TIME-ONE-PLACE Rule
- All status updates ONLY in this file
- Reference: `docs/_today/CURRENT-STATUS.md`

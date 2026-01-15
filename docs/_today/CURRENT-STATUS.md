## WB Framework v3.0 - Current Status

**Date:** 2026-01-14  
**Last Updated:** Builder page + code examples fix

---

## ✅ Completed Today

### 1. Get Started Button Updates
- Made buttons 20% smaller (changed from `wb-btn--xl` to `wb-btn--lg`)
- Changed link target from `?page=docs` to `?page=builder`
- Updated in hero section and CTA section of home.html

### 2. Builder Page Created
- **File:** `pages/builder.html` - Interactive "Get Started" page
- Features: Quick start guide, core concepts, live demo, architecture overview
- Includes interactive card builder with real-time preview

### 3. Builder Documentation
- **File:** `docs/builder.md` - Comprehensive documentation
- Covers: Zero-build philosophy, Light DOM, Schema-First development
- Includes: Architecture layers, builder pipeline, behavior system

### 4. Navigation Updated
- Added "Get Started" menu item to `config/site.json`
- Links to new builder page

### 5. Code Examples Fixed
- **Issue:** `<wb-mdhtml>` blocks were parsing `<wb-*>` tags as HTML elements
- **Solution:** Replaced with `<pre><code>` blocks using HTML entities (`&lt;` / `&gt;`)
- **Result:** Code examples now display correctly on components page

### 6. Cross-Browser Support (from earlier)
- CSS Normalize and Safari fixes
- ResizeObserver utilities
- Feature detection (no UA sniffing)
- Playwright cross-browser projects

---

## 📁 Files Created Today

| File | Purpose |
|------|---------|
| `pages/builder.html` | Get Started / Builder introduction page |
| `docs/builder.md` | Builder documentation |

---

## 📁 Files Modified Today

| File | Change |
|------|--------|
| `pages/home.html` | Smaller Get Started button, links to builder |
| `pages/components.html` | Fixed code examples with HTML entities |
| `config/site.json` | Added builder nav item |

---

## 🔧 Known Issues

### wb-mdhtml Limitation
The `<wb-mdhtml>` component cannot safely render inline HTML code examples because:
- The browser parses `<wb-*>` tags as HTML before markdown processing
- This strips out the intended code content

**Workaround:** Use `<pre><code>` with HTML entities, or use `data-src` to load from external markdown files.

---

## 📝 ONE-TIME-ONE-PLACE Rule
- All status updates ONLY in this file
- Reference: `docs/_today/CURRENT-STATUS.md`

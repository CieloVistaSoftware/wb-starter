# WB Behaviors – Current Status (2026)

**Last Updated:** 2026-01-22

---

## ✅ Issues Form Redesign: Complete

**Feature:** Redesigned the issues reporting UI from ugly textarea to proper form with draggable/resizable dialog.

**Changes:**
- Form-based layout with Type, Priority, Description, Steps fields
- Title auto-generated from first 30 chars of description (not editable)
- Type selection: 🐛 Bug, ✨ Feature, 💡 Improve (toggle buttons)
- Priority selection: Low (green), Medium (yellow), High (orange), Critical (red)
- Dialog is draggable (grab header) and resizable (corner handle)
- Position and size saved to localStorage (`wb-issues-dialog`)
- View All Issues modal with filter tabs (All, Pending, Review, Done)

**Files Changed:**
- `src/wb-viewmodels/issues.js` - Complete rewrite with form UI
- `src/styles/behaviors/issues.css` - New form-focused styles

---

## ✅ Draggable/Resizable Persistence: Complete

**Feature:** Added `persist` option to both `draggable` and `resizable` behaviors for localStorage persistence.

**Usage:**
```html
<!-- Position saved -->
<div x-draggable data-persist="my-panel">Drag me</div>

<!-- Size saved -->
<div x-resizable data-persist="my-panel">Resize me</div>

<!-- Both saved (use same key for combined storage) -->
<div x-draggable x-resizable data-persist="my-dialog">Both</div>
```

**Storage Keys:**
| Behavior | Key Format | Data |
|----------|------------|------|
| draggable | `wb-draggable-{persist}` | `{ x, y }` |
| resizable | `wb-resizable-{persist}` | `{ width, height }` |

**Files Changed:**
- `src/wb-viewmodels/draggable.js` - Added persist option
- `src/wb-viewmodels/resizable.js` - Added persist option
- `src/wb-models/draggable.schema.json` - Updated schema with all options
- `src/wb-models/resizable.schema.json` - Updated schema with all options

---

## ✅ Preview Spacing System: Complete

**Feature:** Consistent vertical spacing in builder, preview, and exported files.

**Spacing Rules:**
| Element Type | Spacing | Applies To |
|--------------|---------|------------|
| Page Components | 4rem (64px) | Direct children of .page, .page-content, main |
| Semantic Elements | 2rem (32px) | section, article, aside |
| Text Elements | 1rem (16px) | p, h1-h6, ul, ol, blockquote |
| Media Elements | 1.5rem (24px) | figure, img, video, audio, iframe |
| WB Components | 4rem (64px) | wb-hero, wb-features, wb-pricing, etc. |

**Files Changed:**
- `src/styles/builder.css` - Builder canvas spacing
- `preview.html` - Preview mode spacing
- `src/builder/builder-export.js` - SPA/MPA export spacing

---

## ✅ Builder Component HTML View: Complete

**Feature:** Each component dropped into the builder canvas now has a "Show HTML" button (`{ }`) that displays the raw HTML code of that component.

**Implementation:**
- `toggleComponentHtml()` function toggles between visual preview and formatted HTML code
- Button appears in component overlay next to delete button
- Active state (green) indicates HTML view is visible
- HTML is auto-formatted with indentation for readability

**Files Changed:**
- `src/builder/builder-components.js` - Added toggle function and button to all component types
- `src/styles/builder.css` - Added button and HTML view panel styles
- `src/wb-models/builder.schema.json` - Added componentHtmlView interaction rules
- `docs/builder/builder-html-view.md` - Feature documentation
- `tests/compliance/builder-html-view.spec.ts` - Compliance tests (8/8 passing)

---

## ✅ Builder Preview Navigation Fix: Complete

**Issue:** Clicking nav links (Home/About/Contact) in preview.html navigated to actual server pages instead of switching preview content.

**Fix:** Added `setupNavigationInterception()` function that intercepts anchor clicks, extracts pageId from href, and calls `showPage()` instead of navigating.

**Files Changed:**
- `preview.html`
- `tests/compliance/preview-navigation.spec.ts`

---

## ✅ Builder Preview Fix: Complete

**Issue:** Elements added via EditorToolbar (`+ Element` / `+ Component` buttons) weren't showing in Preview or Export.

**Root Cause:** EditorToolbar adds elements to DOM directly without syncing to the `components` array that `previewSite()` was reading from.

**Fix:** Added `extractCanvasHTML()` and `extractComponentHTML()` functions to `builder-export.js` that extract clean HTML directly from the DOM canvas, removing builder UI wrappers. Updated `previewSite()`, `exportAsSPA()`, and `exportAsMPA()` to use DOM extraction.

**Files Changed:**
- `src/builder/builder-export.js`

---

## ✅ Mobile-First CSS: Complete

All core CSS (site.css, builder.css) now uses a mobile-first approach with `min-width` media queries. This ensures the best experience on all devices, with progressive enhancement for larger screens.

### Breakpoints
| Breakpoint | Target |
|------------|--------|
| 0–480px    | Mobile |
| 481px+     | Tablet portrait |
| 769px+     | Tablet landscape/Desktop |
| 1200px+    | Large desktop |
| 1400px+    | Extra large (builder only) |

---

## Test & Dev Commands

```bash
npm test                # Run all tests
npm run test:compliance # Static compliance
npm run test:behaviors  # Behavior tests
npm run test:firefox    # Firefox
npm run test:webkit     # Safari/WebKit
npm run test:mobile     # Mobile Chrome/Safari
npm run test:browsers   # All browsers
npm run test:ui         # Playwright UI mode
npm run test:single     # Single-threaded (debug)
```

---

## Where to Find More

- See docs/_today/TODO.md for current priorities
- See docs/builder/pages.md for page builder rules
- See docs/builder.md for builder architecture
- See docs/MVVM-MIGRATION.md for migration and architecture

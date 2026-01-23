# WB Framework – Current Status (2026)

**Last Updated:** 2026-01-17

---

## ✅ Mobile-First CSS: Complete

All core CSS (site.css, builder.css) now uses a mobile-first approach with `min-width` media queries. This ensures the best experience on all devices, with progressive enhancement for larger screens.

### Highlights
- **site.css:**
  - Mobile base: 1-column, touch targets, compact header/footer
  - Tablet: Wider nav, larger typography
  - Desktop: Sidebar nav, multi-column grid, expanded panels
  - Large desktop: 1400px+ max width
- **builder.css:**
  - Mobile: Shows "Desktop Recommended" notice, hides builder UI
  - Tablet+: Builder UI visible, panels scale up
  - Desktop+: Full builder experience, wide panels

### Key Principles
1. Base = mobile, enhance up
2. Only `min-width` queries (never `max-width`)
3. Touch-friendly, accessible, responsive
4. Single source of truth for breakpoints (see site.css)
5. 100dvh for safe area

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

## Recent Improvements

- Builder HTML layout fixes
- "URL Slug" → "Relative URL" label
- Dynamic page settings header
- Status bar relative URL display
- Template indicator
- builder-enhancements.js module integration
- Cross-browser test suite (26+ tests passing)
- Custom Elements Manifest generator
- Code highlighting fix (mdhtml.js)

---

## Where to Find More

- See docs/plans/_today/TODO.md for current priorities
- See docs/builder/pages.md for page builder rules
- See docs/builder.md for builder architecture
- See docs/plans/MVVM-MIGRATION.md for migration and architecture

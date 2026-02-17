# REPAIR PLAN — Page & Demo Compliance
**Date:** 2026-02-15
**Total Failures:** 20 (16 page-fragment + 4 demo)

---

## SUMMARY OF ALL FAILURES

### Page Fragment Compliance — 16 failures (8 unique issues, each retried once)

| # | Page | Failure | Root Cause | Fix |
|---|------|---------|------------|-----|
| 1 | hero-variants.html | >3 inline styles | ~130 inline styles for layout demos | Extract to `src/styles/pages/hero-variants.css` |
| 2 | links.html | >3 inline styles | ~15 inline styles for card layouts | Extract to `src/styles/pages/links.css` |
| 3 | docs.html | >3 inline styles | Inline styles on layout wrappers | Extract to `src/styles/pages/docs.css` |
| 4 | about.html | >3 inline styles | 11 inline styles on hero/sections | Extract to `src/styles/pages/about.css` |
| 5 | services.html | >3 inline styles | 21 inline styles on cards/sections | Extract to `src/styles/pages/services.css` |
| 6 | contact.html | >3 inline styles | Inline styles on form/layout | Extract to `src/styles/pages/contact.css` |
| 7 | components.html | >3 inline styles | Inline styles on component showcase | Extract to `src/styles/pages/components.css` |
| 8 | newpage.html | Missing `<h2>` | Builder placeholder, no section heading | Add `<h2>` inside `.page__section` |

### Demo Compliance — 4 failures (1 file, 3 unique rules + retry)

| # | Demo | Failure | Root Cause | Fix |
|---|------|---------|------------|-----|
| 1 | button-variants-simple.html | Missing `<!DOCTYPE html>` | File starts with `<html>`, no doctype | Add `<!DOCTYPE html>` |
| 2 | button-variants-simple.html | Missing `<meta viewport>` | No `<head>` section at all | Add `<head>` with meta tags |
| 3 | button-variants-simple.html | Missing `<title>` | No `<head>` section at all | Add `<title>` in new `<head>` |

---

## EXECUTION RULES

1. **One file at a time** — fix → test → confirm → next
2. **CSS extraction pattern**: inline styles → named classes in `src/styles/pages/{name}.css`
3. **Page-specific CSS only** — layout positioning, never component styles (Tier 1 Law #10)
4. **Link page CSS via** `<link rel="stylesheet" href="../src/styles/pages/{name}.css">` (only allowed page-specific link)
5. **No `<style>` blocks** — everything goes in external CSS files
6. **Preserve visual appearance** — extracted CSS must replicate the inline styles exactly
7. **Max 3 inline styles per page** — anything over gets extracted, tiny tweaks (< 20 chars) are OK

---

## EXECUTION ORDER

### Phase 1: Quick Wins (2 files, 5 min)
1. **newpage.html** — Add `<h2>` tag
2. **button-variants-simple.html** — Add doctype, head, meta, title

### Phase 2: Light Inline Extraction (3 files, ~15 min each)
3. **docs.html** — Extract inline styles → `pages/docs.css`
4. **links.html** — Extract inline styles → `pages/links.css`
5. **contact.html** — Extract inline styles → `pages/contact.css`

### Phase 3: Heavy Inline Extraction (4 files, ~20 min each)
6. **about.html** — Extract 11 inline styles → `pages/about.css`
7. **services.html** — Extract 21 inline styles → `pages/services.css`
8. **components.html** — Extract inline styles → `pages/components.css`
9. **hero-variants.html** — Extract ~130 inline styles → `pages/hero-variants.css` (biggest job)

### Phase 4: Full Re-test
10. Run both compliance tests — target 0 failures

---

## PROGRESS LOG

| Time | Action | Result |
|------|--------|--------|
| Start | Baseline tests | 16 page fails, 4 demo fails |

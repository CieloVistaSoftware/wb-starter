# CSS Standards & OOP Architecture

## Overview

The Web Behaviors (WB) library follows strict Object-Oriented CSS (OOCSS) principles. Styles are layered, inherited, and never duplicated. Every CSS file has a single responsibility and inherits from the layers above it.

---

## CSS Layer Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: FOUNDATION (loaded once in index.html)                │
├─────────────────────────────────────────────────────────────────┤
│  src/styles/themes.css    - 25+ themes, ALL CSS variables       │
│  styles/site.css          - Site layout structure               │
│                                                                 │
│  NOTE: Only TWO files needed at foundation level!               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ inherited by all pages
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: BEHAVIORS (src/behaviors/css/)                        │
│  One CSS file per behavior GROUP (matches JS grouping)          │
│  Loaded as needed by WB or manually                             │
├─────────────────────────────────────────────────────────────────┤
│  card.css         - All 19 card behavior styles                 │
│  feedback.css     - Alert, badge, progress, spinner, toast...   │
│  inputs.css       - Input, checkbox, switch, rating, select...  │
│  navigation.css   - Navbar, sidebar, tabs, menu, pagination...  │
│  data.css         - Table, list, timeline, code, json...        │
│  effects.css      - Animation keyframes only                    │
│  layouts.css      - Grid, flex, container, stack...             │
│  overlay.css      - Modal, drawer, popover, lightbox...         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ inherited
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: PAGE-SPECIFIC (only for standalone pages)             │
│  Pages loaded into index.html do NOT need their own CSS imports │
├─────────────────────────────────────────────────────────────────┤
│  builder.css      - Standalone builder app (pages/builder.html) │
│  (most pages need NO custom CSS - they inherit from index.html) │
└─────────────────────────────────────────────────────────────────┘
                              ↓ optional
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: PREMIUM/SIGNATURE (optional enhancements)             │
│  Only load if premium effects needed                            │
├─────────────────────────────────────────────────────────────────┤
│  wb-signature.css - Glassmorphism, gradients, glow effects      │
│  (NOT required for base functionality)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## index.html - The CSS Foundation

The `index.html` loads foundation CSS once. **Only TWO files needed:**

```html
<!-- index.html - CORRECT minimal setup -->
<head>
  <!-- Layer 1: Foundation (only 2 files!) -->
  <link rel="stylesheet" href="src/styles/themes.css">
  <link rel="stylesheet" href="styles/site.css">
  
  <!-- Layer 4: OPTIONAL premium effects -->
  <!-- <link rel="stylesheet" href="styles/wb-signature.css"> -->
</head>
```

### ❌ WRONG (violates OOP):
```html
<head>
  <link rel="stylesheet" href="src/styles/themes.css">
  <link rel="stylesheet" href="styles/site.css">
  <link rel="stylesheet" href="styles/wb-signature.css">   <!-- Optional, not required -->
  <link rel="stylesheet" href="styles/wb-components.css">  <!-- DELETE - duplicates themes! -->
</head>
```

**Pages in `/pages/` are HTML fragments** loaded into `#app` - they do NOT need CSS imports because they inherit from `index.html`.

---

## Files to DELETE or Refactor

| File | Issue | Action |
|------|-------|--------|
| `styles/wb-components.css` | Duplicates theme variables, mixed concerns | DELETE - move component styles to `src/behaviors/css/` |
| `styles/wb-signature.css` | Premium effects | KEEP but make optional (Layer 4) |

---

## Page Types & CSS Requirements

### Type 1: Content Pages (pages/*.html loaded into index.html)
**NO CSS imports needed** - inherits everything from index.html

```html
<!-- pages/home.html - NO <head>, NO CSS imports -->
<div class="page">
  <h1>Welcome</h1>
  <div data-wb="card" data-title="Hello">Content</div>
</div>
```

### Type 2: Standalone Pages (full HTML documents)
**MUST import from the top of hierarchy** - builder.html, test pages, etc.

```html
<!-- pages/builder.html - standalone, needs full imports -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <!-- Start at Layer 1 (only 2 files!) -->
  <link rel="stylesheet" href="../src/styles/themes.css">
  <link rel="stylesheet" href="../styles/site.css">
  <!-- Layer 3: Page-specific (unique styles only) -->
  <link rel="stylesheet" href="builder.css">
</head>
```

### Type 3: Behavior Demo Pages (src/behaviors/html/*.html)
**Minimal imports** - testing behaviors only

```html
<!-- src/behaviors/html/card.html - behavior demo -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <!-- Only what's needed for testing -->
  <link rel="stylesheet" href="../../src/styles/themes.css">
  <link rel="stylesheet" href="../css/card.css">
</head>
```

---

## OOP Rules (MANDATORY)

| Rule | Description |
|------|-------------|
| **No Duplication** | Never repeat selectors or properties across files |
| **Inherit Variables** | Always use `var(--name)`, never hardcode colors |
| **Single Source** | Colors → themes.css ONLY, Layout → site.css ONLY |
| **Extend, Don't Override** | Add modifier classes, don't redefine base |
| **Group by Function** | One CSS file per behavior group |
| **No `!important`** | Fix specificity properly (exception: preview mode) |
| **Content Pages = No CSS** | Pages loaded into index.html inherit everything |
| **No Variable Aliases** | Don't create `--wb-bg-primary` when `--bg-primary` exists |

---

## Theme Variables Reference

All styles MUST use these variables from `themes.css` (the ONLY source):

### Colors
```css
/* Backgrounds - USE THESE */
var(--bg-color)        /* Page background */
var(--bg-primary)      /* Cards, panels */
var(--bg-secondary)    /* Hover states */
var(--bg-tertiary)     /* Active states */

/* Text - USE THESE */
var(--text-primary)    /* Main text */
var(--text-secondary)  /* Secondary text */
var(--text-muted)      /* Disabled, hints */

/* Brand - USE THESE */
var(--primary)         /* Primary actions */
var(--primary-dark)    /* Hover state */
var(--primary-light)   /* Light variant */
var(--secondary)       /* Secondary actions */
var(--accent)          /* Accents, highlights */

/* Borders - USE THESE */
var(--border-color)    /* Default borders */
var(--border-light)    /* Subtle borders */
var(--border-dark)     /* Strong borders */

/* Semantic - USE THESE */
var(--success-color)   /* Success states */
var(--danger-color)    /* Error, delete */
var(--warning-color)   /* Warnings */
var(--info-color)      /* Info states */
```

### ❌ DO NOT CREATE ALIASES
```css
/* WRONG - creates duplicate variables */
:root {
  --wb-bg-primary: var(--bg-primary);  /* NO! Just use --bg-primary */
  --wb-text-primary: var(--text-primary);  /* NO! */
}
```

### Spacing
```css
var(--space-xs)        /* 0.25rem */
var(--space-sm)        /* 0.5rem */
var(--space-md)        /* 1rem */
var(--space-lg)        /* 1.5rem */
var(--space-xl)        /* 2rem */
```

### Typography
```css
var(--text-xs)         /* 0.75rem */
var(--text-sm)         /* 0.875rem */
var(--text-base)       /* 1rem */
var(--text-lg)         /* 1.125rem */
var(--text-xl)         /* 1.25rem */
var(--font-medium)     /* 500 */
var(--font-semibold)   /* 600 */
var(--font-bold)       /* 700 */
```

### Borders & Radius
```css
var(--radius-sm)       /* 0.125rem */
var(--radius-base)     /* 0.25rem */
var(--radius-md)       /* 0.375rem */
var(--radius-lg)       /* 0.5rem */
var(--radius-xl)       /* 0.75rem */
var(--radius-full)     /* 9999px (pill) */
```

### Transitions
```css
var(--transition-fast)    /* 0.15s ease */
var(--transition-base)    /* 0.2s ease */
var(--transition-medium)  /* 0.3s ease */
var(--transition-slow)    /* 0.5s ease */
```

---

## Component Spacing Guidelines

To ensure visual consistency, follow these spacing rules for specific component types:

### Panels & Containers
*   **Padding:** Use `var(--space-md)` (1rem) for standard panel padding.
*   **Gap:** Use `var(--space-md)` for gaps between major sections within a panel.
*   **Border Radius:** Use `var(--radius-lg)` (0.5rem) for outer containers/panels.
*   **Responsive Grids:** Use `minmax(250px, 1fr)` for card grids to ensure items never become too narrow. Avoid fixed column counts (e.g., `repeat(4, 1fr)`) that break on smaller screens.

### Editor Controls & Inputs
*   **Height:** Standard inputs/buttons should be `36px` (or `2.25rem`) high.
*   **Padding:** Use `var(--space-sm)` (0.5rem) horizontal padding for inputs/buttons.
*   **Gap:** Use `var(--space-sm)` between related controls (e.g., a label and its input, or a group of buttons).
*   **Margins:** Avoid outer margins on controls; use parent flex/grid gaps instead.

### Text & Typography
*   **Headings:** Bottom margin should be `var(--space-sm)` for small headings (h4-h6) and `var(--space-md)` for large headings (h1-h3).
*   **Paragraphs:** Bottom margin should be `var(--space-md)`.
*   **Wrapping:** All text in cards and containers must wrap automatically. Do not use `white-space: nowrap` or `text-overflow: ellipsis` unless specifically required for a single-line UI element (like a badge).
*   **Long Words:** Use `word-break: break-word` or `overflow-wrap: anywhere` for content that might contain long strings (URLs, filenames).

### Lists & Items
*   **List Items:** Use `var(--space-xs)` or `var(--space-sm)` padding for list items.
*   **Separators:** Use `1px solid var(--border-color)` for dividers between items.

---

## Decision Tree: Does My Page Need CSS Imports?

```
Is it a full HTML document with <!DOCTYPE html>?
│
├─ NO → Content fragment loaded into index.html
│       → NO CSS imports needed (inherits from index.html)
│
└─ YES → Standalone page
         │
         ├─ Is it in pages/ folder?
         │  → Import: themes.css → site.css → page.css (if unique)
         │
         └─ Is it a behavior demo in src/behaviors/html/?
            → Import: themes.css → behavior group css only
```

---

## File Structure Summary

```
wb-starter/
├── index.html              ← Loads foundation CSS (2 files only!)
├── src/styles/
│   └── themes.css          ← Layer 1: ALL variables & themes
├── styles/
│   ├── site.css            ← Layer 1: Site layout only
│   └── wb-signature.css    ← Layer 4: Optional premium effects
├── src/behaviors/
│   ├── css/                ← Layer 2: Behavior styles
│   │   ├── card.css
│   │   ├── feedback.css
│   │   ├── inputs.css
│   │   ├── effects.css     ← Animation @keyframes
│   │   └── ...
│   └── html/               ← Behavior demos (standalone)
│       └── card.html
└── pages/
    ├── home.html           ← Fragment, NO CSS imports
    ├── about.html          ← Fragment, NO CSS imports
    ├── builder.html        ← Standalone, HAS CSS imports
    └── builder.css         ← Layer 3: Page-specific only
```

---

## Writing New Behavior CSS

Each behavior CSS file follows this structure:

```css
/**
 * [Group Name] Behavior Styles
 * Inherits from: themes.css (via index.html or direct import)
 * Behaviors: list, of, behaviors, covered
 */

/* =============================================================================
   BASE COMPONENT
   ============================================================================= */
.wb-componentname {
  background: var(--bg-primary);      /* USE theme var */
  color: var(--text-primary);         /* USE theme var */
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

/* =============================================================================
   VARIANTS
   ============================================================================= */
.wb-componentname--primary { background: var(--primary); }
.wb-componentname--success { background: var(--success-color); }

/* =============================================================================
   STATES
   ============================================================================= */
.wb-componentname:hover { background: var(--bg-secondary); }
.wb-componentname--disabled { opacity: 0.5; pointer-events: none; }

/* =============================================================================
   SIZES
   ============================================================================= */
.wb-componentname--sm { padding: var(--space-xs) var(--space-sm); }
.wb-componentname--lg { padding: var(--space-md) var(--space-lg); }

/* =============================================================================
   SPECIAL LAYOUT RULES
   ============================================================================= */
/* Docs Viewer: No scrollbars on children */
#docs-div-1 > * {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
#docs-div-1 > *::-webkit-scrollbar {
  display: none;
}
```

---

## Checklist Before Committing CSS

- [ ] Uses only `var(--theme-variables)` from themes.css
- [ ] No duplicate variables (no `--wb-*` aliases)
- [ ] No duplicate selectors across files
- [ ] Correct layer placement
- [ ] Content pages have NO CSS imports
- [ ] Standalone pages import themes.css + site.css only
- [ ] No `!important` (except documented exceptions)
- [ ] File matches JS group naming (if behavior CSS)

---

## Migration: Cleaning Up wb-components.css

The `styles/wb-components.css` file violates OOP by:
1. Redefining theme variables with `--wb-*` prefix
2. Mixing component styles that belong in behavior CSS
3. Duplicating keyframes that belong in `effects.css`

**Action items:**
1. Move component styles to appropriate `src/behaviors/css/*.css` files
2. Move `@keyframes` to `src/behaviors/css/effects.css`
3. DELETE `styles/wb-components.css`
4. Update `index.html` to remove the import

---

*This document is the single source of truth for CSS architecture in the WB Behaviors.*

# Class Naming & Semantics

## Prime Directive: Generic, Reusable, Semantic

- **Only use generic, reusable class names** for all layout and component styling. Examples: `.hero`, `.section`, `.features`, `.feature-grid`.
- **HTML5 semantic elements** (e.g., `<section>`, `<header>`, `<main>`, `<footer>`, `<nav>`) must be used for all page structure. Avoid generic `<div>` for major page regions.
- **Prohibited:**
  - Page-specific, BEM, or context-coupled class names (e.g., `home-hero`, `page__feature`, `about-section`, `main-content--dark`).
  - `.wb-*` classes in global CSS or markup. These are reserved strictly for internal styles within custom elements (e.g., `<wb-demo>`). Do **not** use `.wb-*` classes in any global stylesheet or outside their component's shadow scope.
- **No BEM or OOCSS prefixes**: Do not use double underscores, double hyphens, or page/component prefixes in class names.
- **Component classes**: Custom elements (e.g., `<wb-demo>`) may use internal classes prefixed with their tag (e.g., `.wb-demo-feature`), but these must not leak into global or page-level markup or CSS.
- **Rationale:** This ensures maximum reusability, maintainability, and clarity across all pages and components.

**Example (Correct):**
```html
<section class="hero">
  <div class="features">
    <div class="feature-grid">
      ...
    </div>
  </div>
</section>
```

**Example (Incorrect):**
```html
<section class="wb-hero">
  <div class="wb-demo-feature">
    ...
  </div>
</section>
```

**Schema Enforcement:**
...existing code...

**Example (Correct):**
```html
<section class="hero">
  <div class="features">
    <div class="feature-grid">
      ...
    </div>
  </div>
</section>
```

**Example (Incorrect):**
```html
<section class="home-hero">
  <div class="page__features">
    <div class="feature-grid--dark">
      ...
    </div>
  </div>
</section>
```

**Schema Enforcement:**
- All schemas (e.g., `home-page.schema.json`) must require only generic, reusable class names and HTML5 semantic elements for page structure.
- Validation will fail if any page-specific, BEM, or context-coupled class is used.

---

# WB Style Constitution & Golden Rules

> **"One Time, One Place for All Style Rules"**

This document serves as the supreme law for styling in the Web Behaviors (WB) library. It consolidates rules from `css-standards.md` and `themes.md` while establishing strict behavioral integrity guidelines.

---

## 🚨 The Prime Directive: The Isolation Rule

**Behaviors must NEVER modify global layout containers or styles outside their direct scope.**

*   **Violation Example:** The `scrollalong` behavior modified `.site__body` (a global container) to enable sticky positioning, which broke the entire app shell layout.
*   **Correct Approach:** A behavior should only modify the specific element it is attached to. If a behavior requires a specific global layout to function, it is likely incompatible with the current architecture or requires a dedicated layout component, not a side-effect.

**Rule:** If your style or behavior touches `body`, `html`, `.site`, `.site__body`, or `.site__main`, **STOP**. You are likely breaking the architecture.

---

## 🏛️ The Three Pillars of WB Styling

### 1. Object-Oriented CSS (OOCSS)
*   **Principle:** Styles are layered, inherited, and never duplicated.
*   **Reference:** See [CSS Standards](css-standards.md) for the detailed architectural layers.
*   **Rule:** Never import CSS in content pages (`pages/*.html`). They inherit everything from `index.html`.

### 2. The Theme System
*   **Principle:** All colors, spacing, and typography are defined as CSS variables in `themes.css`.
*   **Reference:** See [Themes Documentation](themes.md).
*   **Rule:** **NEVER hardcode a hex code.** Always use `var(--primary)`, `var(--bg-color)`, etc.
*   **Rule:** **NO ALIASES.** Do not create `--wb-bg-primary` when `--bg-primary` exists.

### 3. Behavioral Integrity
*   **Principle:** Styles exist to *support* behavior, not wreck it.
*   **Rule:** A component's style must be self-contained. It should not rely on or affect the positioning of its siblings or parents (unless it is explicitly a Layout component).

---

## 📜 The Strict Rules List

### 1. No Global Side Effects (The "Scrollalong" Rule)
As stated in the Prime Directive, components and behaviors are strictly forbidden from modifying the global DOM structure or styles of parent containers (`.site__body`, etc.).

### 2. The "Two-File" Foundation
The `index.html` head must only load **TWO** CSS files for the foundation:
1.  `src/styles/themes.css` (Variables)
2.  `styles/site.css` (Layout)
*All other styles are loaded on-demand by behaviors or are optional layers.*

### 3. Variable Purity
*   **Do:** Use `var(--text-primary)`
*   **Don't:** `color: #333;` (Breaks themes)
*   **Don't:** `:root { --my-text: var(--text-primary); }` (Creates useless aliases)

### 4. Specificity over `!important`
*   **Rule:** Never use `!important` to override styles. Use proper CSS specificity (classes, nesting) instead.
*   **Exception:** Utility classes (e.g., `.d-none !important`) or debug tools.

### 5. File Responsibility
*   **`themes.css`**: Variables ONLY. No layout.
*   **`site.css`**: Global shell layout ONLY. No component styles.
*   **`src/behaviors/css/*.css`**: Component styles ONLY. Grouped by function (e.g., `card.css`, `inputs.css`).

---

## 🗺️ Where Do My Styles Go?

| If you are styling... | It goes in... |
|-----------------------|---------------|
| A new color or font size | `src/styles/themes.css` (as a variable) |
| The main header or sidebar layout | `styles/site.css` |
| A specific component (e.g., Card, Button) | `src/behaviors/css/[group].css` |
| A standalone page (e.g., Builder) | `pages/[page].css` (loaded manually) |
| A one-off tweak for a specific demo | Inline `<style>` (only if absolutely necessary) |

---

---

## 🧩 Dashboard & Viewer Design Patterns

Standalone HTML pages in `public/` (dashboards, viewers, tools) follow a shared visual language.

### The Grid-Seam Pattern ("Snap-In Cards")

Creates the injection-molded plastic look where cards appear snapped into a grid frame.

**Three ingredients:**
1. Parent gets the seam color as `background`
2. `gap: 1px` exposes that background between children
3. Children get the card `background`, filling over the seam

```css
.grid-seam {
  display: grid;
  grid-template-columns: repeat(N, 1fr);
  gap: 1px;                        /* seam width */
  background: var(--border);       /* seam color bleeds through gap */
  border-bottom: 1px solid var(--border);
}
.grid-seam > .cell {
  background: var(--bg-card);      /* card surface sits on the seam */
  padding: 16px 20px;
}
```

This avoids double-borders, collapse issues, and nth-child hacks. The grid gap cannot accept `border` — the parent background trick is the canonical workaround.

### Depth Layering Palette

Dashboards use a 4-tier background stack. Each tier is slightly brighter, creating physical depth:

| Tier | Variable | Hex | Usage |
|------|----------|-----|-------|
| 0 (deepest) | `--bg` | `#0a0e17` | Page background, recessed areas |
| 1 | `--bg-card-alt` | `#0f1623` | Secondary panels, filter bars |
| 2 | `--bg-card` | `#111827` | Primary cards, headers, stat cells |
| 3 (surface) | `--border` | `#1e293b` | Grid seams, dividers, separator lines |

Text follows an inverse stack — brighter text on deeper backgrounds:

| Variable | Hex | Usage |
|----------|-----|-------|
| `--text` | `#e2e8f0` | Primary content |
| `--text-dim` | `#64748b` | Labels, secondary info |
| `--text-muted` | `#475569` | Disabled, tertiary info |

### Status Colors

| Variable | Hex | Semantic |
|----------|-----|----------|
| `--green` | `#22c55e` | Passed, success |
| `--red` | `#ef4444` | Failed, error |
| `--yellow` | `#eab308` | Skipped, warning |
| `--blue` | `#3b82f6` | Running, info |
| `--cyan` | `#06b6d4` | Accent, branding, links |

Each status color has a `--*-bg` variant at 8% opacity for subtle background tints:
```css
--green-bg: rgba(34,197,94,0.08);
--red-bg: rgba(239,68,68,0.08);
```

### Typography

| Variable | Font | Usage |
|----------|------|-------|
| `--mono` | `JetBrains Mono` | Labels, stats, code, file paths |
| `--sans` | `IBM Plex Sans` | Body text, test names, descriptions |

### Reference Implementation

`public/test-dashboard.html` is the canonical example of these patterns.

---

*This document supersedes all previous style guides. In case of conflict, the Prime Directive applies.*

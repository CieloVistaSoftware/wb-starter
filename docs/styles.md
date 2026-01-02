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

*This document supersedes all previous style guides. In case of conflict, the Prime Directive applies.*
